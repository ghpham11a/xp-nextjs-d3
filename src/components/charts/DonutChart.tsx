"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

export default function DonutChart({
  data,
  width = 400,
  height = 400,
}: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2 - 20;

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const colorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(data.map((d) => d.label));

    const pie = d3
      .pie<DataPoint>()
      .value((d) => d.value)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<DataPoint>>()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const labelArc = d3
      .arc<d3.PieArcDatum<DataPoint>>()
      .innerRadius(radius * 0.75)
      .outerRadius(radius * 0.75);

    const arcs = g
      .selectAll(".arc")
      .data(pie(data))
      .join("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => colorScale(d.data.label))
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    arcs
      .append("text")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .text((d) => d.data.label);

    // Center text showing total
    const total = data.reduce((sum, d) => sum + d.value, 0);
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text(total);

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .attr("font-size", "14px")
      .attr("fill", "currentColor")
      .attr("opacity", 0.7)
      .text("Total");
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
