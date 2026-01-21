"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

interface ProjectionTransitionProps {
  width?: number;
  height?: number;
}

type ProjectionType = "orthographic" | "equirectangular" | "mercator" | "naturalEarth";

const projectionFactories: Record<ProjectionType, () => d3.GeoProjection> = {
  orthographic: () => d3.geoOrthographic().clipAngle(90),
  equirectangular: () => d3.geoEquirectangular(),
  mercator: () => d3.geoMercator(),
  naturalEarth: () => d3.geoNaturalEarth1(),
};

const projectionNames: Record<ProjectionType, string> = {
  orthographic: "Orthographic",
  equirectangular: "Equirectangular",
  mercator: "Mercator",
  naturalEarth: "Natural Earth",
};

export default function ProjectionTransition({
  width = 500,
  height = 350,
}: ProjectionTransitionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentProjection, setCurrentProjection] = useState<ProjectionType>("orthographic");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const transitionTo = useCallback(
    (targetType: ProjectionType) => {
      if (!svgRef.current || isTransitioning || targetType === currentProjection) return;
      setIsTransitioning(true);

      const svg = d3.select(svgRef.current);

      const sourceProjection = projectionFactories[currentProjection]()
        .scale(Math.min(width, height) / 3)
        .translate([width / 2, height / 2]);

      const targetProjection = projectionFactories[targetType]()
        .scale(Math.min(width, height) / 3)
        .translate([width / 2, height / 2]);

      // Get the graticule
      const graticule = d3.geoGraticule10();
      const sphere = { type: "Sphere" } as d3.GeoPermissibleObjects;

      // Interpolate between projections
      const duration = 1500;
      const t0 = Date.now();

      function animate() {
        const t = Math.min(1, (Date.now() - t0) / duration);
        const ease = d3.easeCubicInOut(t);

        // Create interpolated projection
        const interpolatedProjection = (coords: [number, number]) => {
          const source = sourceProjection(coords);
          const target = targetProjection(coords);
          if (!source || !target) return null;
          return [
            source[0] * (1 - ease) + target[0] * ease,
            source[1] * (1 - ease) + target[1] * ease,
          ] as [number, number];
        };

        const path = d3.geoPath({
          stream: (output) => ({
            point(x, y) {
              const result = interpolatedProjection([x, y]);
              if (result) output.point(result[0], result[1]);
            },
            sphere() {
              output.sphere();
            },
            lineStart() {
              output.lineStart();
            },
            lineEnd() {
              output.lineEnd();
            },
            polygonStart() {
              output.polygonStart();
            },
            polygonEnd() {
              output.polygonEnd();
            },
          }),
        });

        svg.select("path.sphere").attr("d", path(sphere) ?? "");
        svg.select("path.graticule").attr("d", path(graticule) ?? "");

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          setCurrentProjection(targetType);
          setIsTransitioning(false);
        }
      }

      animate();
    },
    [currentProjection, isTransitioning, width, height]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const projection = projectionFactories[currentProjection]()
      .scale(Math.min(width, height) / 3)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath(projection);

    // Draw sphere
    svg
      .append("path")
      .attr("class", "sphere")
      .datum({ type: "Sphere" } as d3.GeoPermissibleObjects)
      .attr("fill", "#dbeafe")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 1.5)
      .attr("d", path);

    // Draw graticule
    svg
      .append("path")
      .attr("class", "graticule")
      .datum(d3.geoGraticule10())
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 0.5)
      .attr("d", path);

    // Draw some sample points
    const cities = [
      { name: "New York", coords: [-74, 40.7] as [number, number] },
      { name: "London", coords: [-0.1, 51.5] as [number, number] },
      { name: "Tokyo", coords: [139.7, 35.7] as [number, number] },
      { name: "Sydney", coords: [151.2, -33.9] as [number, number] },
      { name: "São Paulo", coords: [-46.6, -23.5] as [number, number] },
    ];

    svg
      .selectAll("circle")
      .data(cities)
      .join("circle")
      .attr("cx", (d) => projection(d.coords)?.[0] ?? 0)
      .attr("cy", (d) => projection(d.coords)?.[1] ?? 0)
      .attr("r", 4)
      .attr("fill", "#ef4444")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5);

    // Projection name label
    svg
      .append("text")
      .attr("class", "projection-label")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .text(projectionNames[currentProjection]);
  }, [currentProjection, width, height]);

  const projectionTypes: ProjectionType[] = ["orthographic", "equirectangular", "mercator", "naturalEarth"];

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex flex-wrap gap-2 justify-center">
        {projectionTypes.map((type) => (
          <button
            key={type}
            onClick={() => transitionTo(type)}
            disabled={isTransitioning || type === currentProjection}
            className={`px-2 py-1 text-xs rounded ${
              type === currentProjection
                ? "bg-blue-500 text-white"
                : "bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            } disabled:opacity-50`}
          >
            {projectionNames[type]}
          </button>
        ))}
      </div>
    </div>
  );
}
