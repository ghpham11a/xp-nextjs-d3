"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

export interface CollapsibleTreeNode {
  name: string;
  children?: CollapsibleTreeNode[];
}

interface CollapsibleTreeProps {
  data: CollapsibleTreeNode;
  width?: number;
  height?: number;
}

interface TreeNodeWithState extends d3.HierarchyPointNode<CollapsibleTreeNode> {
  _children?: TreeNodeWithState[];
  x0?: number;
  y0?: number;
}

export default function CollapsibleTree({
  data,
  width = 500,
  height = 350,
}: CollapsibleTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 120, bottom: 20, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tree = d3.tree<CollapsibleTreeNode>().size([innerHeight, innerWidth]);

    const root = d3.hierarchy(data) as TreeNodeWithState;
    root.x0 = innerHeight / 2;
    root.y0 = 0;

    // Collapse all children initially except first level
    const collapse = (d: TreeNodeWithState) => {
      if (d.children) {
        d._children = d.children as TreeNodeWithState[];
        d._children.forEach(collapse);
        d.children = undefined;
      }
    };

    if (root.children) {
      root.children.forEach((child) => collapse(child as TreeNodeWithState));
    }

    const diagonal = d3
      .linkHorizontal<d3.HierarchyPointLink<CollapsibleTreeNode>, d3.HierarchyPointNode<CollapsibleTreeNode>>()
      .x((d) => d.y)
      .y((d) => d.x);

    function update(source: TreeNodeWithState) {
      const duration = 500;

      const treeData = tree(root);
      const nodes = treeData.descendants() as TreeNodeWithState[];
      const links = treeData.links();

      // Normalize for fixed-depth
      nodes.forEach((d) => {
        d.y = d.depth * 100;
      });

      // Nodes
      const node = g.selectAll<SVGGElement, TreeNodeWithState>("g.node").data(nodes, (d) => d.data.name);

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", () => `translate(${source.y0 ?? 0},${source.x0 ?? 0})`)
        .attr("cursor", "pointer")
        .on("click", (event, d) => {
          if (d._children) {
            d.children = d._children;
            d._children = undefined;
          } else if (d.children) {
            d._children = d.children as TreeNodeWithState[];
            d.children = undefined;
          }
          update(d);
        });

      nodeEnter
        .append("circle")
        .attr("r", 1e-6)
        .attr("fill", (d) => (d._children ? "#6366f1" : "#a5b4fc"))
        .attr("stroke", "#4f46e5")
        .attr("stroke-width", 1.5);

      nodeEnter
        .append("text")
        .attr("dy", "0.35em")
        .attr("x", (d) => (d.children || d._children ? -10 : 10))
        .attr("text-anchor", (d) => (d.children || d._children ? "end" : "start"))
        .attr("fill", "currentColor")
        .attr("font-size", "10px")
        .text((d) => d.data.name)
        .attr("fill-opacity", 1e-6);

      const nodeUpdate = nodeEnter.merge(node);

      nodeUpdate
        .transition()
        .duration(duration)
        .attr("transform", (d) => `translate(${d.y},${d.x})`);

      nodeUpdate
        .select("circle")
        .attr("r", 5)
        .attr("fill", (d) => (d._children ? "#6366f1" : "#a5b4fc"));

      nodeUpdate.select("text").attr("fill-opacity", 1);

      const nodeExit = node
        .exit<TreeNodeWithState>()
        .transition()
        .duration(duration)
        .attr("transform", () => `translate(${source.y},${source.x})`)
        .remove();

      nodeExit.select("circle").attr("r", 1e-6);
      nodeExit.select("text").attr("fill-opacity", 1e-6);

      // Links
      const link = g
        .selectAll<SVGPathElement, d3.HierarchyPointLink<CollapsibleTreeNode>>("path.link")
        .data(links, (d) => d.target.data.name);

      const linkEnter = link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.3)
        .attr("stroke-width", 1.5)
        .attr("d", () => {
          const o = { x: source.x0 ?? 0, y: source.y0 ?? 0 };
          return diagonal({ source: o, target: o } as d3.HierarchyPointLink<CollapsibleTreeNode>);
        });

      linkEnter
        .merge(link)
        .transition()
        .duration(duration)
        .attr("d", diagonal as unknown as string);

      link
        .exit<d3.HierarchyPointLink<CollapsibleTreeNode>>()
        .transition()
        .duration(duration)
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o } as d3.HierarchyPointLink<CollapsibleTreeNode>);
        })
        .remove();

      // Store positions for next transition
      nodes.forEach((d) => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    update(root);
  }, [data, width, height]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <p className="text-xs text-zinc-500">Click nodes to expand/collapse</p>
    </div>
  );
}
