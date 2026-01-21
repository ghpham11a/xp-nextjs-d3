"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface ZoomableTreemapNode {
  name: string;
  value?: number;
  children?: ZoomableTreemapNode[];
}

interface ZoomableTreemapProps {
  data: ZoomableTreemapNode;
  width?: number;
  height?: number;
}

export default function ZoomableTreemap({
  data,
  width = 500,
  height = 350,
}: ZoomableTreemapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentNode, setCurrentNode] = useState<d3.HierarchyRectangularNode<ZoomableTreemapNode> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const treemap = d3
      .treemap<ZoomableTreemapNode>()
      .tile(d3.treemapSquarify)
      .size([width, height])
      .padding(1)
      .round(true);

    const root = treemap(hierarchy);
    setCurrentNode(root);

    // Get unique parent categories for colors
    const categories = new Set<string>();
    root.each((d) => {
      if (d.depth === 1) categories.add(d.data.name);
    });
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Array.from(categories));

    const getColor = (d: d3.HierarchyRectangularNode<ZoomableTreemapNode>) => {
      let node = d;
      while (node.depth > 1 && node.parent) node = node.parent;
      return colorScale(node.data.name);
    };

    // Create the main group
    const g = svg.append("g").attr("class", "treemap-group");

    const render = (node: d3.HierarchyRectangularNode<ZoomableTreemapNode>) => {
      g.selectAll("*").remove();

      const nodes = node.children ?? [node];
      const x = d3.scaleLinear().domain([node.x0, node.x1]).range([0, width]);
      const y = d3.scaleLinear().domain([node.y0, node.y1]).range([0, height]);

      const cell = g
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("transform", (d) => `translate(${x(d.x0)},${y(d.y0)})`);

      cell
        .append("rect")
        .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", (d) => Math.max(0, y(d.y1) - y(d.y0) - 1))
        .attr("fill", (d) => {
          if (d.children) {
            return d3.color(getColor(d))?.darker(0.5)?.toString() ?? getColor(d);
          }
          return getColor(d);
        })
        .attr("fill-opacity", (d) => (d.children ? 0.5 : 0.9))
        .attr("rx", 2)
        .attr("cursor", (d) => (d.children ? "pointer" : "default"))
        .on("click", (event, d) => {
          event.stopPropagation();
          if (d.children) {
            setCurrentNode(d);
          }
        });

      // Labels
      cell
        .append("clipPath")
        .attr("id", (d, i) => `clip-zoom-${i}`)
        .append("rect")
        .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", (d) => Math.max(0, y(d.y1) - y(d.y0) - 1));

      cell
        .append("text")
        .attr("clip-path", (d, i) => `url(#clip-zoom-${i})`)
        .attr("x", 4)
        .attr("y", 16)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "600")
        .text((d) => d.data.name);

      cell
        .filter((d) => x(d.x1) - x(d.x0) > 50 && y(d.y1) - y(d.y0) > 35)
        .append("text")
        .attr("clip-path", (d, i) => `url(#clip-zoom-${i})`)
        .attr("x", 4)
        .attr("y", 32)
        .attr("fill", "white")
        .attr("fill-opacity", 0.7)
        .attr("font-size", "10px")
        .text((d) => d3.format(",")(d.value ?? 0));

      // Drill indicator
      cell
        .filter((d) => d.children !== undefined)
        .append("text")
        .attr("x", (d) => Math.max(0, x(d.x1) - x(d.x0) - 16))
        .attr("y", 16)
        .attr("fill", "white")
        .attr("fill-opacity", 0.5)
        .attr("font-size", "10px")
        .text("▶");
    };

    render(root);

    // Back button behavior
    svg.on("click", () => {
      if (currentNode && currentNode.parent) {
        setCurrentNode(currentNode.parent);
      }
    });
  }, [data, width, height]);

  useEffect(() => {
    if (!svgRef.current || !currentNode) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select<SVGGElement>(".treemap-group");

    const categories = new Set<string>();
    let rootNode = currentNode;
    while (rootNode.parent) rootNode = rootNode.parent;
    rootNode.each((d) => {
      if (d.depth === 1) categories.add(d.data.name);
    });
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(Array.from(categories));

    const getColor = (d: d3.HierarchyRectangularNode<ZoomableTreemapNode>) => {
      let node = d;
      while (node.depth > 1 && node.parent) node = node.parent;
      return colorScale(node.data.name);
    };

    g.selectAll("*").remove();

    const nodes = currentNode.children ?? [currentNode];
    const x = d3.scaleLinear().domain([currentNode.x0, currentNode.x1]).range([0, width]);
    const y = d3.scaleLinear().domain([currentNode.y0, currentNode.y1]).range([0, height]);

    const cell = g
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d) => `translate(${x(d.x0)},${y(d.y0)})`);

    cell
      .append("rect")
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", (d) => Math.max(0, y(d.y1) - y(d.y0) - 1))
      .attr("fill", (d) => (d.children ? d3.color(getColor(d))?.darker(0.3)?.toString() ?? getColor(d) : getColor(d)))
      .attr("fill-opacity", (d) => (d.children ? 0.6 : 0.9))
      .attr("rx", 2)
      .attr("cursor", (d) => (d.children ? "pointer" : "default"))
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.children) {
          setCurrentNode(d);
        }
      });

    cell
      .append("clipPath")
      .attr("id", (d, i) => `clip-zoom-${i}`)
      .append("rect")
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0) - 1))
      .attr("height", (d) => Math.max(0, y(d.y1) - y(d.y0) - 1));

    cell
      .append("text")
      .attr("clip-path", (d, i) => `url(#clip-zoom-${i})`)
      .attr("x", 4)
      .attr("y", 16)
      .attr("fill", "white")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text((d) => d.data.name);

    cell
      .filter((d) => x(d.x1) - x(d.x0) > 50 && y(d.y1) - y(d.y0) > 35)
      .append("text")
      .attr("clip-path", (d, i) => `url(#clip-zoom-${i})`)
      .attr("x", 4)
      .attr("y", 32)
      .attr("fill", "white")
      .attr("fill-opacity", 0.7)
      .attr("font-size", "10px")
      .text((d) => d3.format(",")(d.value ?? 0));

    cell
      .filter((d) => d.children !== undefined)
      .append("text")
      .attr("x", (d) => Math.max(0, x(d.x1) - x(d.x0) - 16))
      .attr("y", 16)
      .attr("fill", "white")
      .attr("fill-opacity", 0.5)
      .attr("font-size", "10px")
      .text("▶");
  }, [currentNode, width, height]);

  const handleZoomOut = () => {
    if (currentNode?.parent) {
      setCurrentNode(currentNode.parent);
    }
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
