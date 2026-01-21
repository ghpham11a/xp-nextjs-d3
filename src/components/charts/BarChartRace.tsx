"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface BarRaceDataFrame {
  date: string;
  values: { name: string; value: number; category?: string }[];
}

interface BarChartRaceProps {
  data: BarRaceDataFrame[];
  width?: number;
  height?: number;
  barsToShow?: number;
}

export default function BarChartRace({
  data,
  width = 500,
  height = 350,
  barsToShow = 10,
}: BarChartRaceProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const margin = { top: 30, right: 10, bottom: 30, left: 100 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allCategories = Array.from(
    new Set(data.flatMap((d) => d.values.map((v) => v.category ?? v.name)))
  );
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(allCategories);

  const updateChart = useCallback(
    (frameIndex: number) => {
      if (!svgRef.current || !data[frameIndex]) return;

      const svg = d3.select(svgRef.current);
      const frame = data[frameIndex];

      const sortedValues = [...frame.values]
        .sort((a, b) => b.value - a.value)
        .slice(0, barsToShow);

      const maxValue = d3.max(sortedValues, (d) => d.value) ?? 0;

      const xScale = d3.scaleLinear().domain([0, maxValue]).range([0, innerWidth]);

      const yScale = d3
        .scaleBand()
        .domain(sortedValues.map((d) => d.name))
        .range([0, innerHeight])
        .padding(0.1);

      // Update bars
      const bars = svg
        .select<SVGGElement>(".bars")
        .selectAll<SVGRectElement, (typeof sortedValues)[0]>("rect")
        .data(sortedValues, (d) => d.name);

      bars
        .enter()
        .append("rect")
        .attr("x", margin.left)
        .attr("y", innerHeight + margin.top)
        .attr("height", yScale.bandwidth())
        .attr("fill", (d) => colorScale(d.category ?? d.name))
        .attr("rx", 2)
        .merge(bars)
        .transition()
        .duration(500)
        .ease(d3.easeLinear)
        .attr("y", (d) => (yScale(d.name) ?? 0) + margin.top)
        .attr("width", (d) => xScale(d.value))
        .attr("height", yScale.bandwidth());

      bars.exit().transition().duration(500).attr("y", innerHeight + margin.top).remove();

      // Update labels
      const labels = svg
        .select<SVGGElement>(".labels")
        .selectAll<SVGTextElement, (typeof sortedValues)[0]>("text")
        .data(sortedValues, (d) => d.name);

      labels
        .enter()
        .append("text")
        .attr("x", margin.left - 5)
        .attr("y", innerHeight + margin.top)
        .attr("text-anchor", "end")
        .attr("fill", "currentColor")
        .attr("font-size", "11px")
        .merge(labels)
        .transition()
        .duration(500)
        .ease(d3.easeLinear)
        .attr("y", (d) => (yScale(d.name) ?? 0) + margin.top + yScale.bandwidth() / 2 + 4)
        .text((d) => d.name);

      labels.exit().transition().duration(500).attr("y", innerHeight + margin.top).remove();

      // Update value labels
      const valueLabels = svg
        .select<SVGGElement>(".values")
        .selectAll<SVGTextElement, (typeof sortedValues)[0]>("text")
        .data(sortedValues, (d) => d.name);

      valueLabels
        .enter()
        .append("text")
        .attr("x", margin.left + 5)
        .attr("y", innerHeight + margin.top)
        .attr("fill", "white")
        .attr("font-size", "10px")
        .attr("font-weight", "bold")
        .merge(valueLabels)
        .transition()
        .duration(500)
        .ease(d3.easeLinear)
        .attr("x", (d) => margin.left + xScale(d.value) - 5)
        .attr("y", (d) => (yScale(d.name) ?? 0) + margin.top + yScale.bandwidth() / 2 + 4)
        .attr("text-anchor", "end")
        .text((d) => d3.format(",")(d.value));

      valueLabels.exit().remove();

      // Update date label
      svg
        .select(".date-label")
        .text(frame.date);
    },
    [data, barsToShow, colorScale, innerWidth, innerHeight, margin.left, margin.top]
  );

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create groups
    svg.append("g").attr("class", "bars");
    svg.append("g").attr("class", "labels");
    svg.append("g").attr("class", "values");

    // Date label
    svg
      .append("text")
      .attr("class", "date-label")
      .attr("x", width - margin.right - 10)
      .attr("y", height - 10)
      .attr("text-anchor", "end")
      .attr("fill", "currentColor")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("opacity", 0.3);

    updateChart(0);
  }, [data, width, height, margin.right, updateChart]);

  useEffect(() => {
    updateChart(currentIndex);
  }, [currentIndex, updateChart]);

  useEffect(() => {
    if (isPlaying && data.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % data.length);
      }, 600);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, data.length]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setCurrentIndex(0)}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
