"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

export interface BoundingBoxRegion {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface ZoomToBoundingBoxProps {
  regions: BoundingBoxRegion[];
  width?: number;
  height?: number;
}

export default function ZoomToBoundingBox({
  regions,
  width = 500,
  height = 350,
}: ZoomToBoundingBoxProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const zoomToRegion = useCallback(
    (region: BoundingBoxRegion) => {
      if (!svgRef.current || !zoomRef.current) return;

      const svg = d3.select(svgRef.current);

      // Calculate the transform to fit the region
      const padding = 20;
      const regionWidth = region.width + padding * 2;
      const regionHeight = region.height + padding * 2;

      const scale = Math.min(width / regionWidth, height / regionHeight);
      const centerX = region.x + region.width / 2;
      const centerY = region.y + region.height / 2;

      svg
        .transition()
        .duration(750)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-centerX, -centerY)
        );
    },
    [width, height]
  );

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.transition().duration(750).call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !regions.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create content group
    const g = svg.append("g").attr("class", "content");

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Draw background
    g.append("rect")
      .attr("x", -100)
      .attr("y", -100)
      .attr("width", width + 200)
      .attr("height", height + 200)
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.03);

    // Draw regions
    const regionGroups = g
      .selectAll("g.region")
      .data(regions)
      .join("g")
      .attr("class", "region")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        zoomToRegion(d);
      });

    regionGroups
      .append("rect")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y)
      .attr("width", (d) => d.width)
      .attr("height", (d) => d.height)
      .attr("fill", (d) => d.color)
      .attr("fill-opacity", 0.6)
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 2)
      .attr("rx", 4);

    regionGroups
      .append("text")
      .attr("x", (d) => d.x + d.width / 2)
      .attr("y", (d) => d.y + d.height / 2)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .text((d) => d.name);

    // Add some random content inside regions
    regions.forEach((region) => {
      const numDots = 5 + Math.floor(Math.random() * 10);
      for (let i = 0; i < numDots; i++) {
        g.append("circle")
          .attr("cx", region.x + Math.random() * region.width)
          .attr("cy", region.y + Math.random() * region.height)
          .attr("r", 3 + Math.random() * 5)
          .attr("fill", "white")
          .attr("fill-opacity", 0.5);
      }
    });

    return () => {
      svg.on(".zoom", null);
    };
  }, [regions, width, height, zoomToRegion]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-hidden border border-zinc-200 dark:border-zinc-700 rounded"
      />
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={resetZoom}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Reset
        </button>
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() => zoomToRegion(region)}
            className="px-2 py-1 text-xs rounded hover:opacity-80"
            style={{ backgroundColor: region.color, color: "white" }}
          >
            {region.name}
          </button>
        ))}
      </div>
    </div>
  );
}
