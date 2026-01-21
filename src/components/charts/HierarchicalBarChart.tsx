"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface HierarchicalBarNode {
  name: string;
  value?: number;
  children?: HierarchicalBarNode[];
}

interface HierarchicalBarChartProps {
  data: HierarchicalBarNode;
  width?: number;
  height?: number;
}

export default function HierarchicalBarChart({
  data,
  width = 500,
  height = 350,
}: HierarchicalBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentNode, setCurrentNode] = useState<d3.HierarchyNode<HierarchicalBarNode> | null>(null);
  const [ancestors, setAncestors] = useState<d3.HierarchyNode<HierarchicalBarNode>[]>([]);

  const margin = { top: 30, right: 20, bottom: 10, left: 30 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    if (!data) return;
    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    setCurrentNode(hierarchy);
  }, [data]);

  useEffect(() => {
    if (!svgRef.current || !currentNode) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const children = currentNode.children ?? [];
    const maxValue = d3.max(children, (d) => d.value ?? 0) ?? 0;

    const xScale = d3.scaleLinear().domain([0, maxValue]).range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(children.map((d) => d.data.name))
      .range([0, innerHeight])
      .padding(0.2);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Breadcrumb
    const breadcrumb = svg
      .append("g")
      .attr("class", "breadcrumb")
      .attr("transform", `translate(${margin.left}, 15)`);

    const crumbs = [{ name: "Root", node: null }, ...ancestors.map((a) => ({ name: a.data.name, node: a }))];
    if (currentNode.data.name !== data.name || ancestors.length > 0) {
      crumbs.push({ name: currentNode.data.name, node: currentNode });
    }

    let xOffset = 0;
    crumbs.forEach((crumb, i) => {
      const isLast = i === crumbs.length - 1;
      const text = breadcrumb
        .append("text")
        .attr("x", xOffset)
        .attr("y", 0)
        .attr("fill", isLast ? "currentColor" : "#3b82f6")
        .attr("font-size", "11px")
        .attr("cursor", isLast ? "default" : "pointer")
        .attr("font-weight", isLast ? "bold" : "normal")
        .text(crumb.name)
        .on("click", () => {
          if (!isLast && crumb.node) {
            const newAncestors = ancestors.slice(0, ancestors.indexOf(crumb.node));
            setAncestors(newAncestors);
            setCurrentNode(crumb.node);
          } else if (!isLast && !crumb.node) {
            // Root clicked
            const hierarchy = d3
              .hierarchy(data)
              .sum((d) => d.value ?? 0)
              .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
            setCurrentNode(hierarchy);
            setAncestors([]);
          }
        });

      xOffset += (text.node()?.getComputedTextLength() ?? 40) + 5;

      if (!isLast) {
        breadcrumb
          .append("text")
          .attr("x", xOffset)
          .attr("y", 0)
          .attr("fill", "currentColor")
          .attr("font-size", "11px")
          .attr("opacity", 0.5)
          .text("›");
        xOffset += 15;
      }
    });

    // Bars container
    const barsGroup = svg
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Draw bars
    barsGroup
      .selectAll("rect")
      .data(children)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d) => yScale(d.data.name) ?? 0)
      .attr("width", 0)
      .attr("height", yScale.bandwidth())
      .attr("fill", (d) => colorScale(d.data.name))
      .attr("rx", 2)
      .attr("cursor", (d) => (d.children ? "pointer" : "default"))
      .on("click", (event, d) => {
        if (d.children) {
          setAncestors([...ancestors, currentNode]);
          setCurrentNode(d);
        }
      })
      .transition()
      .duration(500)
      .attr("width", (d) => xScale(d.value ?? 0));

    // Labels
    barsGroup
      .selectAll(".label")
      .data(children)
      .join("text")
      .attr("class", "label")
      .attr("x", 8)
      .attr("y", (d) => (yScale(d.data.name) ?? 0) + yScale.bandwidth() / 2 + 4)
      .attr("fill", "white")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none")
      .text((d) => d.data.name);

    // Value labels
    barsGroup
      .selectAll(".value")
      .data(children)
      .join("text")
      .attr("class", "value")
      .attr("x", (d) => xScale(d.value ?? 0) - 5)
      .attr("y", (d) => (yScale(d.data.name) ?? 0) + yScale.bandwidth() / 2 + 4)
      .attr("text-anchor", "end")
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("opacity", 0.8)
      .attr("pointer-events", "none")
      .text((d) => d3.format(",")(d.value ?? 0));

    // Drill indicator
    barsGroup
      .selectAll(".indicator")
      .data(children.filter((d) => d.children))
      .join("text")
      .attr("class", "indicator")
      .attr("x", (d) => xScale(d.value ?? 0) + 8)
      .attr("y", (d) => (yScale(d.data.name) ?? 0) + yScale.bandwidth() / 2 + 4)
      .attr("fill", "currentColor")
      .attr("font-size", "10px")
      .attr("opacity", 0.5)
      .text("▶");

  }, [currentNode, ancestors, data, innerWidth, innerHeight, margin.left, margin.top]);

  return (
    <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
  );
}
