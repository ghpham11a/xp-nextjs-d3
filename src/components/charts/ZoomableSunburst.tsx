"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface SunburstNode {
  name: string;
  value?: number;
  children?: SunburstNode[];
}

interface ZoomableSunburstProps {
  data: SunburstNode;
  width?: number;
  height?: number;
}

export default function ZoomableSunburst({
  data,
  width = 500,
  height = 350,
}: ZoomableSunburstProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  useEffect(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2 - 10;

    const hierarchy = d3
      .hierarchy(data)
      .sum((d) => d.value ?? 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const partition = d3.partition<SunburstNode>().size([2 * Math.PI, radius]);

    const root = partition(hierarchy);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const arc = d3
      .arc<d3.HierarchyRectangularNode<SunburstNode>>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius((d) => d.y0)
      .outerRadius((d) => d.y1 - 1);

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // Store the current view
    let currentRoot = root;

    const path = g
      .selectAll("path")
      .data(root.descendants().filter((d) => d.depth))
      .join("path")
      .attr("fill", (d) => {
        let node = d;
        while (node.depth > 1 && node.parent) node = node.parent;
        return colorScale(node.data.name);
      })
      .attr("fill-opacity", (d) => (d.children ? 0.7 : 0.9))
      .attr("d", arc as unknown as string)
      .attr("cursor", "pointer")
      .on("click", clicked);

    // Center label
    const centerLabel = g
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .attr("font-size", "12px")
      .attr("fill", "currentColor")
      .attr("pointer-events", "none")
      .text(data.name);

    // Center circle for going back
    g.append("circle")
      .attr("r", root.y0)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .attr("cursor", "pointer")
      .on("click", () => clicked(null, root));

    path.append("title").text(
      (d) =>
        `${d
          .ancestors()
          .map((a) => a.data.name)
          .reverse()
          .join(" → ")}\n${d3.format(",")(d.value ?? 0)}`
    );

    function clicked(event: MouseEvent | null, p: d3.HierarchyRectangularNode<SunburstNode>) {
      currentRoot = p;

      // Update breadcrumbs
      const ancestors = p.ancestors().reverse();
      setBreadcrumbs(ancestors.map((a) => a.data.name));

      // Update center label
      centerLabel.text(p.data.name);

      const target: [number, number, number, number] = [
        p.x0,
        p.x1,
        p.y0,
        p.y1,
      ];

      root.each((d) => {
        (d as d3.HierarchyRectangularNode<SunburstNode> & { target: [number, number, number, number] }).target = [
          Math.max(0, Math.min(1, (d.x0 - target[0]) / (target[1] - target[0]))) * 2 * Math.PI,
          Math.max(0, Math.min(1, (d.x1 - target[0]) / (target[1] - target[0]))) * 2 * Math.PI,
          Math.max(0, d.y0 - target[2]),
          Math.max(0, d.y1 - target[2]),
        ];
      });

      const t = svg.transition().duration(750);

      path
        .transition(t)
        .tween("data", (d) => {
          const current = {
            x0: d.x0,
            x1: d.x1,
            y0: d.y0,
            y1: d.y1,
          };
          const targetNode = (d as d3.HierarchyRectangularNode<SunburstNode> & { target: [number, number, number, number] }).target;
          const target = {
            x0: targetNode[0],
            x1: targetNode[1],
            y0: targetNode[2],
            y1: targetNode[3],
          };
          const i = d3.interpolate(current, target);
          return (t: number) => {
            const interpolated = i(t);
            d.x0 = interpolated.x0;
            d.x1 = interpolated.x1;
            d.y0 = interpolated.y0;
            d.y1 = interpolated.y1;
          };
        })
        .attrTween("d", (d) => () => arc(d) ?? "")
        .attr("fill-opacity", (d) =>
          d.x0 >= target[0] && d.x1 <= target[1] ? (d.children ? 0.7 : 0.9) : 0
        )
        .attr("pointer-events", (d) =>
          d.x0 >= target[0] && d.x1 <= target[1] ? "auto" : "none"
        );
    }

    return () => {
      svg.selectAll("*").remove();
    };
  }, [data, width, height]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      {breadcrumbs.length > 1 && (
        <p className="text-xs text-zinc-500">{breadcrumbs.join(" → ")}</p>
      )}
    </div>
  );
}
