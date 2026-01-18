"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  x: number;
  y: number;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

export default function LineChart({
  data,
  width = 500,
  height = 300,
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.x) as [number, number])
      .range([0, innerWidth]);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.y) ?? 0])
      .nice()
      .range([innerHeight, 0]);

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", "currentColor");

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "currentColor");

    const line = d3
      .line<DataPoint>()
      .x((d) => x(d.x))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX);

    g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    g.selectAll(".dot")
      .data(data)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 5)
      .attr("fill", "#3b82f6");
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
