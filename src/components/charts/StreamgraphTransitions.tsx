"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export interface StreamgraphData {
  date: number;
  values: { [key: string]: number };
}

interface StreamgraphTransitionsProps {
  data: StreamgraphData[];
  width?: number;
  height?: number;
}

type OffsetType = "silhouette" | "wiggle" | "expand" | "none";

export default function StreamgraphTransitions({
  data,
  width = 500,
  height = 350,
}: StreamgraphTransitionsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [offsetType, setOffsetType] = useState<OffsetType>("silhouette");

  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);

    const keys = Object.keys(data[0].values);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);

    // X scale
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.date) as [number, number])
      .range([0, innerWidth]);

    // Stack generator with different offsets
    const offsetMap: Record<OffsetType, d3.StackOffsetExpand | typeof d3.stackOffsetSilhouette | typeof d3.stackOffsetWiggle | typeof d3.stackOffsetNone> = {
      silhouette: d3.stackOffsetSilhouette,
      wiggle: d3.stackOffsetWiggle,
      expand: d3.stackOffsetExpand,
      none: d3.stackOffsetNone,
    };

    const stack = d3
      .stack<StreamgraphData>()
      .keys(keys)
      .value((d, key) => d.values[key] ?? 0)
      .offset(offsetMap[offsetType])
      .order(d3.stackOrderInsideOut);

    const stackedData = stack(data);

    // Y scale
    const yMin = d3.min(stackedData, (layer) => d3.min(layer, (d) => d[0])) ?? 0;
    const yMax = d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1])) ?? 0;
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

    // Area generator
    const area = d3
      .area<d3.SeriesPoint<StreamgraphData>>()
      .x((d) => xScale(d.data.date))
      .y0((d) => yScale(d[0]))
      .y1((d) => yScale(d[1]))
      .curve(d3.curveBasis);

    // Update paths
    const paths = svg
      .select<SVGGElement>(".streams")
      .selectAll<SVGPathElement, d3.Series<StreamgraphData, string>>("path")
      .data(stackedData, (d) => d.key);

    paths
      .enter()
      .append("path")
      .attr("fill", (d) => colorScale(d.key))
      .attr("opacity", 0.8)
      .attr("d", area)
      .merge(paths)
      .transition()
      .duration(1000)
      .attr("d", area);

    paths.exit().remove();

    // Update Y axis
    svg
      .select<SVGGElement>(".y-axis")
      .transition()
      .duration(1000)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickFormat(offsetType === "expand" ? d3.format(".0%") : d3.format("~s"))
      );
  }, [data, offsetType, innerWidth, innerHeight]);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const keys = Object.keys(data[0].values);

    // X scale
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(data, (d) => d.date) as [number, number])
      .range([0, innerWidth]);

    // Create groups
    svg
      .append("g")
      .attr("class", "streams")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // X-axis
    svg
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
      .call(d3.axisBottom(xScale).ticks(6).tickFormat(d3.format("d")))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Y-axis
    svg
      .append("g")
      .attr("class", "y-axis")
      .attr("transform", `translate(${margin.left},${margin.top})`)
      .selectAll("text")
      .attr("fill", "currentColor");

    // Style axis lines
    svg.selectAll(".domain, .tick line").attr("stroke", "currentColor").attr("opacity", 0.3);

    // Legend
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);
    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - margin.right - 60}, ${margin.top})`);

    keys.slice(0, 5).forEach((key, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 14})`);
      g.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", colorScale(key))
        .attr("rx", 2);
      g.append("text")
        .attr("x", 14)
        .attr("y", 9)
        .attr("font-size", "9px")
        .attr("fill", "currentColor")
        .text(key);
    });
  }, [data, width, height, innerWidth, innerHeight, margin.left, margin.top, margin.bottom, margin.right]);

  const cycleOffset = () => {
    const offsets: OffsetType[] = ["silhouette", "wiggle", "expand", "none"];
    const currentIndex = offsets.indexOf(offsetType);
    setOffsetType(offsets[(currentIndex + 1) % offsets.length]);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <button
        onClick={cycleOffset}
        className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 capitalize"
      >
        Offset: {offsetType}
      </button>
    </div>
  );
}
