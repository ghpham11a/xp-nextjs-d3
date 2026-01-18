"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
}

interface TreemapChartProps {
  data: TreeNode;
  width?: number;
  height?: number;
}

export default function TreemapChart({
  data,
  width = 500,
  height = 350,
}: TreemapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const root = d3
      .treemap<TreeNode>()
      .tile(d3.treemapSquarify)
      .size([width, height])
      .padding(2)
      .round(true)(hierarchy);

    const leaves = root.leaves();

    // Color scale based on parent categories
    const parents = new Set(leaves.map((d) => d.parent?.data.name ?? "root"));
    const colorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(Array.from(parents));

    const leaf = svg
      .selectAll("g")
      .data(leaves)
      .join("g")
      .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

    leaf
      .append("rect")
      .attr("fill", (d) => colorScale(d.parent?.data.name ?? "root"))
      .attr("fill-opacity", 0.8)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("rx", 2);

    leaf
      .append("clipPath")
      .attr("id", (d, i) => `clip-${i}`)
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0);

    leaf
      .append("text")
      .attr("clip-path", (d, i) => `url(#clip-${i})`)
      .attr("x", 4)
      .attr("y", 14)
      .attr("fill", "white")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .text((d) => d.data.name)
      .filter((d) => d.x1 - d.x0 > 40 && d.y1 - d.y0 > 30)
      .append("tspan")
      .attr("x", 4)
      .attr("y", 28)
      .attr("fill-opacity", 0.8)
      .attr("font-weight", "normal")
      .text((d) => d3.format(",")(d.value ?? 0));

    leaf.append("title").text(
      (d) =>
        `${d
          .ancestors()
          .reverse()
          .map((d) => d.data.name)
          .join(" → ")}\n${d3.format(",")(d.value ?? 0)}`
    );
  }, [data, width, height]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="overflow-visible"
    />
  );
}
