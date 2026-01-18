"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface DataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
}

export default function BarChart({
  data,
  width = 500,
  height = 300,
}: BarChartProps) {
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
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 0])
      .nice()
      .range([innerHeight, 0]);

    const colorScale = d3
      .scaleOrdinal(d3.schemeTableau10)
      .domain(data.map((d) => d.label));

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("fill", "currentColor");

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .attr("fill", "currentColor");

    g.selectAll(".bar")
      .data(data)
      .join("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.label) ?? 0)
      .attr("y", (d) => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", (d) => innerHeight - y(d.value))
      .attr("fill", (d) => colorScale(d.label))
      .attr("rx", 4);
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
