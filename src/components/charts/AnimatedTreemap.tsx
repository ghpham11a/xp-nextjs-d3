"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface AnimatedTreemapFrame {
  date: string;
  data: TreemapNode;
}

export interface TreemapNode {
  name: string;
  value?: number;
  children?: TreemapNode[];
}

interface AnimatedTreemapProps {
  frames: AnimatedTreemapFrame[];
  width?: number;
  height?: number;
}

export default function AnimatedTreemap({
  frames,
  width = 500,
  height = 350,
}: AnimatedTreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Get all unique categories for consistent colors
  const allCategories = Array.from(
    new Set(
      frames.flatMap((f) =>
        f.data.children?.map((c) => c.name) ?? []
      )
    )
  );
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(allCategories);

  const updateTreemap = useCallback(
    (frameIndex: number) => {
      if (!svgRef.current || !frames[frameIndex]) return;

      const svg = d3.select(svgRef.current);
      const frame = frames[frameIndex];

      const hierarchy = d3
        .hierarchy(frame.data)
        .sum((d) => d.value ?? 0)
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

      const root = d3
        .treemap<TreemapNode>()
        .tile(d3.treemapSquarify)
        .size([width, height - 30])
        .padding(2)
        .round(true)(hierarchy);

      const leaves = root.leaves();

      // Update rectangles
      const rects = svg
        .select<SVGGElement>(".cells")
        .selectAll<SVGGElement, d3.HierarchyRectangularNode<TreemapNode>>("g")
        .data(leaves, (d) => d.data.name);

      // Enter
      const enter = rects.enter().append("g");

      enter
        .append("rect")
        .attr("fill", (d) => colorScale(d.parent?.data.name ?? "root"))
        .attr("fill-opacity", 0.8)
        .attr("rx", 2)
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0 + 30)
        .attr("width", 0)
        .attr("height", 0);

      enter
        .append("clipPath")
        .attr("id", (d, i) => `clip-anim-${i}-${frameIndex}`)
        .append("rect");

      enter
        .append("text")
        .attr("fill", "white")
        .attr("font-size", "10px")
        .attr("font-weight", "500")
        .attr("pointer-events", "none");

      // Update + Enter
      const merged = enter.merge(rects);

      merged
        .select("rect")
        .transition()
        .duration(500)
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0 + 30)
        .attr("width", (d) => Math.max(0, d.x1 - d.x0))
        .attr("height", (d) => Math.max(0, d.y1 - d.y0))
        .attr("fill", (d) => colorScale(d.parent?.data.name ?? "root"));

      merged
        .select("clipPath rect")
        .transition()
        .duration(500)
        .attr("x", (d) => d.x0)
        .attr("y", (d) => d.y0 + 30)
        .attr("width", (d) => Math.max(0, d.x1 - d.x0))
        .attr("height", (d) => Math.max(0, d.y1 - d.y0));

      merged
        .select("text")
        .attr("clip-path", (d, i) => `url(#clip-anim-${i}-${frameIndex})`)
        .transition()
        .duration(500)
        .attr("x", (d) => d.x0 + 4)
        .attr("y", (d) => d.y0 + 44)
        .text((d) => (d.x1 - d.x0 > 30 && d.y1 - d.y0 > 20 ? d.data.name : ""));

      // Exit
      rects
        .exit()
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

      // Update date label
      svg.select(".date-label").text(frame.date);
    },
    [frames, colorScale, width, height]
  );

  useEffect(() => {
    if (!svgRef.current || !frames.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Date label
    svg
      .append("text")
      .attr("class", "date-label")
      .attr("x", width / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    // Cells container
    svg.append("g").attr("class", "cells");

    updateTreemap(0);
  }, [frames, width, height, updateTreemap]);

  useEffect(() => {
    updateTreemap(currentIndex);
  }, [currentIndex, updateTreemap]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % frames.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setCurrentIndex(0)}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
