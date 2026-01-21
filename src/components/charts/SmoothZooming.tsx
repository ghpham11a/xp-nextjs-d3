"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface ZoomPoint {
  x: number;
  y: number;
  label: string;
}

interface SmoothZoomingProps {
  data: ZoomPoint[];
  width?: number;
  height?: number;
}

export default function SmoothZooming({
  data,
  width = 500,
  height = 350,
}: SmoothZoomingProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentZoom, setCurrentZoom] = useState<d3.ZoomTransform | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const zoomToPoint = useCallback(
    (point: ZoomPoint) => {
      if (!svgRef.current || !zoomRef.current) return;

      const svg = d3.select(svgRef.current);
      const scale = 4;

      svg
        .transition()
        .duration(1500)
        .call(
          zoomRef.current.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(scale)
            .translate(-point.x, -point.y)
        );
    },
    [width, height]
  );

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;

    const svg = d3.select(svgRef.current);
    svg
      .transition()
      .duration(1000)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create content group
    const g = svg.append("g").attr("class", "content");

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 10])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setCurrentZoom(event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Draw background grid
    const gridSize = 50;
    const gridGroup = g.append("g").attr("class", "grid");

    for (let x = -width; x < width * 2; x += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", -height)
        .attr("x2", x)
        .attr("y2", height * 2)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1);
    }

    for (let y = -height; y < height * 2; y += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", -width)
        .attr("y1", y)
        .attr("x2", width * 2)
        .attr("y2", y)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1);
    }

    // Draw points
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    g.selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 15)
      .attr("fill", (_, i) => colorScale(String(i)))
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        zoomToPoint(d);
      });

    g.selectAll("text")
      .data(data)
      .join("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "currentColor")
      .attr("pointer-events", "none")
      .text((d) => d.label);

    return () => {
      svg.on(".zoom", null);
    };
  }, [data, width, height, zoomToPoint]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="overflow-hidden border border-zinc-200 dark:border-zinc-700 rounded"
      />
      <div className="flex gap-2 items-center">
        <button
          onClick={resetZoom}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Reset Zoom
        </button>
        {data.slice(0, 3).map((point) => (
          <button
            key={point.label}
            onClick={() => zoomToPoint(point)}
            className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            {point.label}
          </button>
        ))}
        {currentZoom && (
          <span className="text-xs text-zinc-500">
            {currentZoom.k.toFixed(1)}×
          </span>
        )}
      </div>
    </div>
  );
}
