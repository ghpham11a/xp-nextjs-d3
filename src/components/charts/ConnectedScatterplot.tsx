"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface ConnectedScatterData {
  x: number;
  y: number;
  label?: string;
}

interface ConnectedScatterplotProps {
  data: ConnectedScatterData[];
  width?: number;
  height?: number;
}

export default function ConnectedScatterplot({
  data,
  width = 500,
  height = 350,
}: ConnectedScatterplotProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const animate = () => {
    if (!svgRef.current || isAnimating) return;
    setIsAnimating(true);

    const svg = d3.select(svgRef.current);
    const path = svg.select<SVGPathElement>(".line-path");
    const dots = svg.selectAll<SVGCircleElement, ConnectedScatterData>(".dot");
    const labels = svg.selectAll<SVGTextElement, ConnectedScatterData>(".label");

    // Get total length
    const totalLength = path.node()?.getTotalLength() ?? 0;

    // Reset
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength);

    dots.attr("opacity", 0);
    labels.attr("opacity", 0);

    // Animate line
    path
      .transition()
      .duration(3000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0)
      .on("end", () => {
        // Show dots after line is drawn
        dots
          .transition()
          .duration(500)
          .delay((_, i) => i * 100)
          .attr("opacity", 1);

        labels
          .transition()
          .duration(500)
          .delay((_, i) => i * 100)
          .attr("opacity", 1)
          .on("end", () => setIsAnimating(false));
      });
  };

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.x) as [number, number])
      .nice()
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.y) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Y-axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Style axis lines
    g.selectAll(".domain, .tick line").attr("stroke", "currentColor").attr("opacity", 0.3);

    // Line generator
    const line = d3
      .line<ConnectedScatterData>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y))
      .curve(d3.curveCatmullRom);

    // Draw connecting line
    const path = g
      .append("path")
      .datum(data)
      .attr("class", "line-path")
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Animate on mount
    const totalLength = path.node()?.getTotalLength() ?? 0;
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // Draw dots
    g.selectAll(".dot")
      .data(data)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 5)
      .attr("fill", "#3b82f6")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .transition()
      .delay((_, i) => 2000 + i * 100)
      .duration(300)
      .attr("opacity", 1);

    // Draw labels
    g.selectAll(".label")
      .data(data.filter((d) => d.label))
      .join("text")
      .attr("class", "label")
      .attr("x", (d) => xScale(d.x))
      .attr("y", (d) => yScale(d.y) - 10)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .text((d) => d.label ?? "")
      .attr("opacity", 0)
      .transition()
      .delay((_, i) => 2000 + i * 100)
      .duration(300)
      .attr("opacity", 1);

    // Arrow markers for direction
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 8)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#3b82f6");
  }, [data, innerWidth, innerHeight, margin.left, margin.top]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <button
        onClick={animate}
        disabled={isAnimating}
        className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
      >
        {isAnimating ? "Animating..." : "Replay Animation"}
      </button>
    </div>
  );
}
