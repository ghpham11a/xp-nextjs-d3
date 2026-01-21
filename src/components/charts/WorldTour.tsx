"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface WorldTourCountry {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
}

interface WorldTourProps {
  countries: WorldTourCountry[];
  width?: number;
  height?: number;
}

export default function WorldTour({
  countries,
  width = 500,
  height = 350,
}: WorldTourProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  const rotateTo = useCallback(
    (coords: [number, number]) => {
      if (!svgRef.current || !projectionRef.current) return;

      const svg = d3.select(svgRef.current);
      const projection = projectionRef.current;

      // Interpolate rotation
      const currentRotation = projection.rotate();
      const targetRotation: [number, number, number] = [-coords[0], -coords[1], 0];

      svg
        .transition()
        .duration(1500)
        .tween("rotate", () => {
          const r = d3.interpolate(currentRotation, targetRotation);
          return (t: number) => {
            projection.rotate(r(t));
            svg.selectAll("path.sphere").attr("d", d3.geoPath(projection)({ type: "Sphere" }) ?? "");
            svg.selectAll("path.graticule").attr("d", d3.geoPath(projection)(d3.geoGraticule10()) ?? "");
            svg.selectAll("circle.marker").attr("transform", (d) => {
              const country = d as WorldTourCountry;
              const point = projection(country.coordinates);
              if (!point) return "translate(-1000,-1000)";
              return `translate(${point[0]},${point[1]})`;
            });
          };
        });
    },
    []
  );

  useEffect(() => {
    if (!svgRef.current || !countries.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const size = Math.min(width, height);
    const projection = d3
      .geoOrthographic()
      .scale(size / 2 - 10)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(0.5);

    projectionRef.current = projection;

    const path = d3.geoPath(projection);

    // Draw sphere (ocean)
    svg
      .append("path")
      .attr("class", "sphere")
      .datum({ type: "Sphere" } as d3.GeoPermissibleObjects)
      .attr("fill", "#e0f2fe")
      .attr("stroke", "#38bdf8")
      .attr("stroke-width", 1)
      .attr("d", path);

    // Draw graticule (grid lines)
    svg
      .append("path")
      .attr("class", "graticule")
      .datum(d3.geoGraticule10())
      .attr("fill", "none")
      .attr("stroke", "#38bdf8")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", 0.5)
      .attr("d", path);

    // Draw country markers
    svg
      .selectAll("circle.marker")
      .data(countries)
      .join("circle")
      .attr("class", "marker")
      .attr("r", 6)
      .attr("fill", "#ef4444")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("transform", (d) => {
        const point = projection(d.coordinates);
        if (!point) return "translate(-1000,-1000)";
        return `translate(${point[0]},${point[1]})`;
      })
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        const index = countries.indexOf(d);
        setCurrentIndex(index);
        rotateTo(d.coordinates);
      });

    // Current country label
    svg
      .append("text")
      .attr("class", "country-label")
      .attr("x", width / 2)
      .attr("y", height - 15)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "14px")
      .attr("font-weight", "600");

    // Rotate to first country
    if (countries[0]) {
      rotateTo(countries[0].coordinates);
    }
  }, [countries, width, height, rotateTo]);

  useEffect(() => {
    if (!svgRef.current || !countries[currentIndex]) return;

    const svg = d3.select(svgRef.current);
    svg.select(".country-label").text(countries[currentIndex].name);
    rotateTo(countries[currentIndex].coordinates);
  }, [currentIndex, countries, rotateTo]);

  useEffect(() => {
    if (!isPlaying || countries.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % countries.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, countries.length]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setCurrentIndex((p) => (p - 1 + countries.length) % countries.length)}
          className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          ←
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setCurrentIndex((p) => (p + 1) % countries.length)}
          className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          →
        </button>
        <span className="text-xs text-zinc-500">
          {currentIndex + 1} / {countries.length}
        </span>
      </div>
    </div>
  );
}
