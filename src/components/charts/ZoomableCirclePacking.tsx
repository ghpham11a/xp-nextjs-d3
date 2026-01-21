"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface CirclePackingNode {
  name: string;
  value?: number;
  children?: CirclePackingNode[];
}

interface ZoomableCirclePackingProps {
  data: CirclePackingNode;
  width?: number;
  height?: number;
}

export default function ZoomableCirclePacking({
  data,
  width = 500,
  height = 350,
}: ZoomableCirclePackingProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [focus, setFocus] = useState<d3.HierarchyCircularNode<CirclePackingNode> | null>(null);
  const [view, setView] = useState<[number, number, number]>([0, 0, 0]);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const size = Math.min(width, height);
    const margin = 10;

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const pack = d3.pack<CirclePackingNode>().size([size - margin * 2, size - margin * 2]).padding(3);

    const root = pack(hierarchy);

    // Color scale based on depth
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, 5])
      .range(["#6366f1", "#1e1b4b"])
      .interpolate(d3.interpolateHcl);

    setFocus(root);
    setView([root.x, root.y, root.r * 2]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const node = g
      .selectAll<SVGCircleElement, d3.HierarchyCircularNode<CirclePackingNode>>("circle")
      .data(root.descendants())
      .join("circle")
      .attr("fill", (d) => (d.children ? colorScale(d.depth) : "#a5b4fc"))
      .attr("fill-opacity", (d) => (d.children ? 0.5 : 0.8))
      .attr("stroke", (d) => (d.children ? "#4f46e5" : "none"))
      .attr("stroke-width", 1)
      .attr("pointer-events", (d) => (!d.children ? "none" : null))
      .attr("cursor", (d) => (d.children ? "pointer" : "default"))
      .on("click", (event, d) => {
        if (focus !== d) {
          zoomTo(d);
          event.stopPropagation();
        }
      });

    const label = g
      .selectAll<SVGTextElement, d3.HierarchyCircularNode<CirclePackingNode>>("text")
      .data(root.descendants())
      .join("text")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("fill-opacity", 0)
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text((d) => d.data.name);

    // Background click to zoom out
    svg.on("click", () => zoomTo(root));

    function zoomTo(d: d3.HierarchyCircularNode<CirclePackingNode>) {
      setFocus(d);

      const transition = svg
        .transition()
        .duration(750)
        .tween("zoom", () => {
          const k = size / (d.r * 2);
          const currentView = view;
          const targetView: [number, number, number] = [d.x, d.y, d.r * 2];
          const i = d3.interpolateZoom(currentView, targetView);
          return (t: number) => {
            const [x, y, r] = i(t);
            setView([x, y, r]);
            const scale = size / r;
            g.attr("transform", `translate(${width / 2 - x * scale},${height / 2 - y * scale}) scale(${scale})`);
          };
        });

      transition.selectAll<SVGTextElement, d3.HierarchyCircularNode<CirclePackingNode>>("text")
        .filter(function (this: SVGTextElement, n) {
          return n.parent === d || this.style.display === "inline";
        })
        .attr("fill-opacity", (n) => (n.parent === d ? 1 : 0));

      node.attr("pointer-events", (n) => (n.parent === d ? "all" : !n.children ? "none" : null));
    }

    // Initial zoom
    zoomTo(root);

    return () => {
      svg.on("click", null);
    };
  }, [data, width, height]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <p className="text-xs text-zinc-500">Click circles to zoom in, click background to zoom out</p>
    </div>
  );
}
