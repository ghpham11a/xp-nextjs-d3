"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

interface ArcTweenProps {
  width?: number;
  height?: number;
}

export default function ArcTween({
  width = 500,
  height = 350,
}: ArcTweenProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const animate = useCallback(() => {
    if (!svgRef.current || isAnimating) return;
    setIsAnimating(true);

    const svg = d3.select(svgRef.current);
    const radius = Math.min(width, height) / 2 - 20;

    const arc = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius)
      .cornerRadius(5);

    const path = svg.select<SVGPathElement>(".arc-path");

    // Random new end angle
    const newEndAngle = Math.random() * 2 * Math.PI;

    // Get current angles from path data
    const currentData = { startAngle: 0, endAngle: path.datum() as number || Math.PI };

    path
      .datum(newEndAngle)
      .transition()
      .duration(1500)
      .ease(d3.easeCubicInOut)
      .attrTween("d", function (newAngle) {
        const interpolate = d3.interpolate(currentData.endAngle, newAngle);
        return function (t: number) {
          currentData.endAngle = interpolate(t);
          return arc(currentData) ?? "";
        };
      })
      .on("end", () => setIsAnimating(false));

    // Update percentage text
    const percentage = Math.round((newEndAngle / (2 * Math.PI)) * 100);
    svg.select(".percentage-text").text(`${percentage}%`);
  }, [isAnimating, width, height]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2 - 20;

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const arc = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius)
      .cornerRadius(5);

    // Background arc
    g.append("path")
      .attr("class", "bg-arc")
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.1)
      .attr("d", arc({ startAngle: 0, endAngle: 2 * Math.PI }));

    // Foreground arc
    const initialAngle = Math.PI;
    g.append("path")
      .attr("class", "arc-path")
      .datum(initialAngle)
      .attr("fill", "#6366f1")
      .attr("d", arc({ startAngle: 0, endAngle: initialAngle }));

    // Center text
    g.append("text")
      .attr("class", "percentage-text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text("50%");

    // Auto-animate on mount
    const timeout = setTimeout(animate, 500);
    return () => clearTimeout(timeout);
  }, [width, height, animate]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <button
        onClick={animate}
        disabled={isAnimating}
        className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
      >
        {isAnimating ? "Animating..." : "Randomize"}
      </button>
    </div>
  );
}
