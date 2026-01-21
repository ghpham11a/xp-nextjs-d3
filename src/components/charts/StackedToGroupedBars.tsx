"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface StackedGroupedData {
  category: string;
  values: { [key: string]: number };
}

interface StackedToGroupedBarsProps {
  data: StackedGroupedData[];
  width?: number;
  height?: number;
}

export default function StackedToGroupedBars({
  data,
  width = 500,
  height = 350,
}: StackedToGroupedBarsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isStacked, setIsStacked] = useState(true);

  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);

    // Get all series keys
    const keys = Object.keys(data[0].values);
    const categories = data.map((d) => d.category);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);

    // X scale for categories
    const x0 = d3.scaleBand().domain(categories).range([0, innerWidth]).padding(0.1);

    // X scale for grouped bars within each category
    const x1 = d3.scaleBand().domain(keys).range([0, x0.bandwidth()]).padding(0.05);

    // Calculate max values for both layouts
    const maxStacked = d3.max(data, (d) => d3.sum(Object.values(d.values))) ?? 0;
    const maxGrouped = d3.max(data, (d) => d3.max(Object.values(d.values))) ?? 0;

    const yStacked = d3.scaleLinear().domain([0, maxStacked]).nice().range([innerHeight, 0]);
    const yGrouped = d3.scaleLinear().domain([0, maxGrouped]).nice().range([innerHeight, 0]);

    // Prepare stacked data
    const stackGenerator = d3.stack<StackedGroupedData>().keys(keys).value((d, key) => d.values[key] ?? 0);
    const stackedData = stackGenerator(data);

    // Update bars
    const barsGroup = svg.select<SVGGElement>(".bars");

    if (isStacked) {
      // Stacked layout
      const layers = barsGroup
        .selectAll<SVGGElement, d3.Series<StackedGroupedData, string>>("g.layer")
        .data(stackedData, (d) => d.key);

      const layersEnter = layers.enter().append("g").attr("class", "layer");

      layers.exit().remove();

      const layersMerged = layersEnter.merge(layers).attr("fill", (d) => colorScale(d.key));

      const rects = layersMerged
        .selectAll<SVGRectElement, d3.SeriesPoint<StackedGroupedData>>("rect")
        .data(
          (d) => d,
          (d) => d.data.category
        );

      rects
        .enter()
        .append("rect")
        .attr("x", (d) => margin.left + (x0(d.data.category) ?? 0))
        .attr("width", x0.bandwidth())
        .attr("y", innerHeight + margin.top)
        .attr("height", 0)
        .attr("rx", 1)
        .merge(rects)
        .transition()
        .duration(500)
        .attr("x", (d) => margin.left + (x0(d.data.category) ?? 0))
        .attr("width", x0.bandwidth())
        .attr("y", (d) => margin.top + yStacked(d[1]))
        .attr("height", (d) => yStacked(d[0]) - yStacked(d[1]));

      rects.exit().remove();

      // Update Y axis
      svg
        .select<SVGGElement>(".y-axis")
        .transition()
        .duration(500)
        .call(d3.axisLeft(yStacked).ticks(5));
    } else {
      // Grouped layout
      barsGroup.selectAll("g.layer").remove();

      const categoryGroups = barsGroup
        .selectAll<SVGGElement, StackedGroupedData>("g.category")
        .data(data, (d) => d.category);

      const categoryGroupsEnter = categoryGroups
        .enter()
        .append("g")
        .attr("class", "category")
        .attr("transform", (d) => `translate(${margin.left + (x0(d.category) ?? 0)}, ${margin.top})`);

      categoryGroups.exit().remove();

      const categoryGroupsMerged = categoryGroupsEnter
        .merge(categoryGroups)
        .attr("transform", (d) => `translate(${margin.left + (x0(d.category) ?? 0)}, ${margin.top})`);

      const bars = categoryGroupsMerged
        .selectAll<SVGRectElement, string>("rect")
        .data(
          (d) => keys.map((key) => ({ key, value: d.values[key] ?? 0 })),
          (d) => d.key
        );

      bars
        .enter()
        .append("rect")
        .attr("x", (d) => x1(d.key) ?? 0)
        .attr("width", x1.bandwidth())
        .attr("y", innerHeight)
        .attr("height", 0)
        .attr("fill", (d) => colorScale(d.key))
        .attr("rx", 1)
        .merge(bars)
        .transition()
        .duration(500)
        .attr("x", (d) => x1(d.key) ?? 0)
        .attr("width", x1.bandwidth())
        .attr("y", (d) => yGrouped(d.value))
        .attr("height", (d) => innerHeight - yGrouped(d.value));

      bars.exit().remove();

      // Update Y axis
      svg
        .select<SVGGElement>(".y-axis")
        .transition()
        .duration(500)
        .call(d3.axisLeft(yGrouped).ticks(5));
    }
  }, [data, isStacked, innerWidth, innerHeight, margin.left, margin.top]);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const keys = Object.keys(data[0].values);
    const categories = data.map((d) => d.category);

    const x0 = d3.scaleBand().domain(categories).range([0, innerWidth]).padding(0.1);

    const maxStacked = d3.max(data, (d) => d3.sum(Object.values(d.values))) ?? 0;
    const yStacked = d3.scaleLinear().domain([0, maxStacked]).nice().range([innerHeight, 0]);

    // Create groups
    svg.append("g").attr("class", "bars");

    // X-axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Y-axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .call(d3.axisLeft(yStacked).ticks(5))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Style axis lines
    svg.selectAll(".domain, .tick line").attr("stroke", "currentColor").attr("opacity", 0.3);

    // Legend
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right - 80}, ${margin.top})`);

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);

    keys.forEach((key, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 18})`);
      g.append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", colorScale(key))
        .attr("rx", 2);
      g.append("text")
        .attr("x", 16)
        .attr("y", 10)
        .attr("font-size", "10px")
        .attr("fill", "currentColor")
        .text(key);
    });
  }, [data, width, height, innerWidth, innerHeight, margin.left, margin.top, margin.bottom, margin.right]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <button
        onClick={() => setIsStacked(!isStacked)}
        className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
      >
        {isStacked ? "Switch to Grouped" : "Switch to Stacked"}
      </button>
    </div>
  );
}
