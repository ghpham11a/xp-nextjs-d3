"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface SortableBarChartProps {
  data: { label: string; value: number }[];
  width?: number;
  height?: number;
}

type SortOrder = "original" | "ascending" | "descending";

export default function SortableBarChart({
  data,
  width = 500,
  height = 350,
}: SortableBarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("original");

  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);

    // Sort data based on current order
    const sortedData = [...data];
    if (sortOrder === "ascending") {
      sortedData.sort((a, b) => a.value - b.value);
    } else if (sortOrder === "descending") {
      sortedData.sort((a, b) => b.value - a.value);
    }

    const xScale = d3
      .scaleBand()
      .domain(sortedData.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 0])
      .nice()
      .range([innerHeight, 0]);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Update bars with transition
    const bars = svg
      .select<SVGGElement>(".bars")
      .selectAll<SVGRectElement, (typeof data)[0]>("rect")
      .data(sortedData, (d) => d.label);

    bars
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("x", (d) => margin.left + (xScale(d.label) ?? 0))
            .attr("y", innerHeight + margin.top)
            .attr("width", xScale.bandwidth())
            .attr("height", 0)
            .attr("fill", (d) => colorScale(d.label))
            .attr("rx", 2),
        (update) => update,
        (exit) => exit.remove()
      )
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .attr("x", (d) => margin.left + (xScale(d.label) ?? 0))
      .attr("y", (d) => margin.top + yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.value));

    // Update x-axis with transition
    const xAxis = d3.axisBottom(xScale);
    svg
      .select<SVGGElement>(".x-axis")
      .transition()
      .duration(750)
      .ease(d3.easeCubicInOut)
      .call(xAxis);

  }, [data, sortOrder, innerWidth, innerHeight, margin.left, margin.top]);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 0])
      .nice()
      .range([innerHeight, 0]);

    const xScale = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, innerWidth])
      .padding(0.2);

    // Create groups
    svg.append("g").attr("class", "bars");

    // X-axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Y-axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Style axis lines
    svg.selectAll(".domain, .tick line").attr("stroke", "currentColor").attr("opacity", 0.3);

    // Initial bars
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    svg
      .select<SVGGElement>(".bars")
      .selectAll("rect")
      .data(data, (d) => (d as { label: string }).label)
      .join("rect")
      .attr("x", (d) => margin.left + (xScale(d.label) ?? 0))
      .attr("y", (d) => margin.top + yScale(d.value))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) => innerHeight - yScale(d.value))
      .attr("fill", (d) => colorScale(d.label))
      .attr("rx", 2);
  }, [data, width, height, innerWidth, innerHeight, margin.left, margin.top, margin.bottom]);

  const cycleSortOrder = () => {
    setSortOrder((prev) => {
      if (prev === "original") return "descending";
      if (prev === "descending") return "ascending";
      return "original";
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <button
        onClick={cycleSortOrder}
        className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
      >
        Sort: {sortOrder === "original" ? "Original" : sortOrder === "ascending" ? "Ascending" : "Descending"}
      </button>
    </div>
  );
}
