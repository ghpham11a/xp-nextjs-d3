"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface IcicleNode {
  name: string;
  value?: number;
  children?: IcicleNode[];
}

interface ZoomableIcicleProps {
  data: IcicleNode;
  width?: number;
  height?: number;
}

export default function ZoomableIcicle({
  data,
  width = 500,
  height = 350,
}: ZoomableIcicleProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentNode, setCurrentNode] = useState<d3.HierarchyRectangularNode<IcicleNode> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const partition = d3.partition<IcicleNode>().size([height, width]).padding(1);

    const root = partition(hierarchy);
    setCurrentNode(root);

    // Color scale
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    const getColor = (d: d3.HierarchyRectangularNode<IcicleNode>) => {
      let node = d;
      while (node.depth > 1 && node.parent) node = node.parent;
      return colorScale(node.data.name);
    };

    const g = svg.append("g").attr("class", "icicle-group");

    // Store target positions for animation
    root.each((d) => {
      (d as d3.HierarchyRectangularNode<IcicleNode> & {
        x0_initial: number;
        x1_initial: number;
        y0_initial: number;
        y1_initial: number;
      }).x0_initial = d.x0;
      (d as d3.HierarchyRectangularNode<IcicleNode> & { x1_initial: number }).x1_initial = d.x1;
      (d as d3.HierarchyRectangularNode<IcicleNode> & { y0_initial: number }).y0_initial = d.y0;
      (d as d3.HierarchyRectangularNode<IcicleNode> & { y1_initial: number }).y1_initial = d.y1;
    });

    const cells = g
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.y0},${d.x0})`);

    cells
      .append("rect")
      .attr("width", (d) => d.y1 - d.y0)
      .attr("height", (d) => d.x1 - d.x0)
      .attr("fill", (d) => getColor(d))
      .attr("fill-opacity", (d) => (d.children ? 0.6 : 0.9))
      .attr("cursor", (d) => (d.children ? "pointer" : "default"))
      .attr("rx", 1)
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.children) {
          zoomIn(d);
        }
      });

    cells
      .append("clipPath")
      .attr("id", (d, i) => `clip-icicle-${i}`)
      .append("rect")
      .attr("width", (d) => d.y1 - d.y0)
      .attr("height", (d) => d.x1 - d.x0);

    cells
      .append("text")
      .attr("clip-path", (d, i) => `url(#clip-icicle-${i})`)
      .attr("x", 4)
      .attr("y", 14)
      .attr("fill", "white")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .text((d) => d.data.name);

    function zoomIn(focus: d3.HierarchyRectangularNode<IcicleNode>) {
      setCurrentNode(focus);

      const x = d3.scaleLinear().domain([focus.x0, focus.x1]).range([0, height]);
      const y = d3.scaleLinear().domain([focus.y0, focus.y1]).range([0, width]);

      g.selectAll<SVGGElement, d3.HierarchyRectangularNode<IcicleNode>>("g")
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${y(d.y0)},${x(d.x0)})`)
        .select("rect")
        .attr("width", (d) => Math.max(0, y(d.y1) - y(d.y0)))
        .attr("height", (d) => Math.max(0, x(d.x1) - x(d.x0)));

      g.selectAll<SVGGElement, d3.HierarchyRectangularNode<IcicleNode>>("g")
        .select("clipPath rect")
        .transition()
        .duration(750)
        .attr("width", (d) => Math.max(0, y(d.y1) - y(d.y0)))
        .attr("height", (d) => Math.max(0, x(d.x1) - x(d.x0)));
    }

    function zoomOut() {
      const current = currentNode;
      if (!current?.parent) return;

      const parent = current.parent;
      setCurrentNode(parent);

      const x = d3.scaleLinear().domain([parent.x0, parent.x1]).range([0, height]);
      const y = d3.scaleLinear().domain([parent.y0, parent.y1]).range([0, width]);

      g.selectAll<SVGGElement, d3.HierarchyRectangularNode<IcicleNode>>("g")
        .transition()
        .duration(750)
        .attr("transform", (d) => `translate(${y(d.y0)},${x(d.x0)})`)
        .select("rect")
        .attr("width", (d) => Math.max(0, y(d.y1) - y(d.y0)))
        .attr("height", (d) => Math.max(0, x(d.x1) - x(d.x0)));

      g.selectAll<SVGGElement, d3.HierarchyRectangularNode<IcicleNode>>("g")
        .select("clipPath rect")
        .transition()
        .duration(750)
        .attr("width", (d) => Math.max(0, y(d.y1) - y(d.y0)))
        .attr("height", (d) => Math.max(0, x(d.x1) - x(d.x0)));
    }

    svg.on("click", zoomOut);

    return () => {
      svg.on("click", null);
    };
  }, [data, width, height]);

  const handleZoomOut = () => {
    if (!svgRef.current || !currentNode?.parent) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>(".icicle-group");
    const parent = currentNode.parent;

    setCurrentNode(parent);

    const x = d3.scaleLinear().domain([parent.x0, parent.x1]).range([0, height]);
    const y = d3.scaleLinear().domain([parent.y0, parent.y1]).range([0, width]);

    g.selectAll<SVGGElement, d3.HierarchyRectangularNode<IcicleNode>>("g")
      .transition()
      .duration(750)
      .attr("transform", (d) => `translate(${y(d.y0)},${x(d.x0)})`)
      .select("rect")
      .attr("width", (d) => Math.max(0, y(d.y1) - y(d.y0)))
      .attr("height", (d) => Math.max(0, x(d.x1) - x(d.x0)));

    g.selectAll<SVGGElement, d3.HierarchyRectangularNode<IcicleNode>>("g")
      .select("clipPath rect")
      .transition()
      .duration(750)
      .attr("width", (d) => Math.max(0, y(d.y1) - y(d.y0)))
      .attr("height", (d) => Math.max(0, x(d.x1) - x(d.x0)));
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <button
        onClick={handleZoomOut}
        disabled={!currentNode?.parent}
        className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
      >
        Zoom Out
      </button>
    </div>
  );
}
