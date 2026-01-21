"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface NationData {
  name: string;
  region: string;
  income: number;
  lifeExpectancy: number;
  population: number;
}

export interface WealthHealthFrame {
  year: number;
  nations: NationData[];
}

interface WealthHealthNationsProps {
  frames: WealthHealthFrame[];
  width?: number;
  height?: number;
}

export default function WealthHealthNations({
  frames,
  width = 500,
  height = 350,
}: WealthHealthNationsProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const margin = { top: 30, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const allRegions = Array.from(new Set(frames.flatMap((f) => f.nations.map((n) => n.region))));
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(allRegions);

  // Calculate scales from all data
  const allIncome = frames.flatMap((f) => f.nations.map((n) => n.income));
  const allLifeExp = frames.flatMap((f) => f.nations.map((n) => n.lifeExpectancy));
  const allPopulation = frames.flatMap((f) => f.nations.map((n) => n.population));

  const xScale = d3.scaleLog().domain([d3.min(allIncome) ?? 100, d3.max(allIncome) ?? 100000]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([d3.min(allLifeExp) ?? 20, d3.max(allLifeExp) ?? 90]).range([innerHeight, 0]);
  const radiusScale = d3.scaleSqrt().domain([0, d3.max(allPopulation) ?? 1e9]).range([3, 40]);

  const updateChart = useCallback(
    (frameIndex: number) => {
      if (!svgRef.current || !frames[frameIndex]) return;

      const svg = d3.select(svgRef.current);
      const frame = frames[frameIndex];

      // Update circles
      const circles = svg
        .select<SVGGElement>(".bubbles")
        .selectAll<SVGCircleElement, NationData>("circle")
        .data(frame.nations, (d) => d.name);

      circles
        .enter()
        .append("circle")
        .attr("cx", (d) => margin.left + xScale(d.income))
        .attr("cy", (d) => margin.top + yScale(d.lifeExpectancy))
        .attr("r", 0)
        .attr("fill", (d) => colorScale(d.region))
        .attr("fill-opacity", 0.7)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .merge(circles)
        .transition()
        .duration(500)
        .ease(d3.easeLinear)
        .attr("cx", (d) => margin.left + xScale(d.income))
        .attr("cy", (d) => margin.top + yScale(d.lifeExpectancy))
        .attr("r", (d) => radiusScale(d.population));

      circles.exit().transition().duration(500).attr("r", 0).remove();

      // Update year label
      svg.select(".year-label").text(frame.year);

      // Update tooltips
      svg
        .select<SVGGElement>(".bubbles")
        .selectAll<SVGCircleElement, NationData>("circle")
        .on("mouseover", function (event, d) {
          d3.select(this).attr("stroke-width", 3);
          svg
            .select(".tooltip")
            .style("opacity", 1)
            .html(`<strong>${d.name}</strong><br/>Income: $${d3.format(",")(Math.round(d.income))}<br/>Life Exp: ${d.lifeExpectancy.toFixed(1)}<br/>Pop: ${d3.format(".2s")(d.population)}`)
            .style("left", `${event.offsetX + 10}px`)
            .style("top", `${event.offsetY - 10}px`);
        })
        .on("mouseout", function () {
          d3.select(this).attr("stroke-width", 1);
          svg.select(".tooltip").style("opacity", 0);
        });
    },
    [frames, colorScale, xScale, yScale, radiusScale, margin.left, margin.top]
  );

  useEffect(() => {
    if (!svgRef.current || !frames.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis (log scale)
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5, "~s")
      )
      .selectAll("text")
      .attr("fill", "currentColor");

    // X-axis label
    g.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 35)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "11px")
      .text("Income per capita ($)");

    // Y-axis
    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Y-axis label
    g.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -35)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "11px")
      .text("Life Expectancy (years)");

    // Style axis lines
    g.selectAll(".domain, .tick line").attr("stroke", "currentColor").attr("opacity", 0.3);

    // Bubbles container
    svg.append("g").attr("class", "bubbles");

    // Year label
    svg
      .append("text")
      .attr("class", "year-label")
      .attr("x", width - margin.right - 10)
      .attr("y", margin.top + 30)
      .attr("text-anchor", "end")
      .attr("fill", "currentColor")
      .attr("font-size", "48px")
      .attr("font-weight", "bold")
      .attr("opacity", 0.2);

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${margin.left + 10}, ${margin.top + 10})`);

    allRegions.slice(0, 5).forEach((region, i) => {
      const lg = legend.append("g").attr("transform", `translate(0, ${i * 14})`);
      lg.append("circle").attr("r", 4).attr("cx", 4).attr("cy", 4).attr("fill", colorScale(region));
      lg.append("text")
        .attr("x", 12)
        .attr("y", 8)
        .attr("font-size", "9px")
        .attr("fill", "currentColor")
        .text(region);
    });

    updateChart(0);
  }, [frames, width, height, innerWidth, innerHeight, margin, xScale, yScale, allRegions, colorScale, updateChart]);

  useEffect(() => {
    updateChart(currentIndex);
  }, [currentIndex, updateChart]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % frames.length);
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          type="range"
          min={0}
          max={frames.length - 1}
          value={currentIndex}
          onChange={(e) => {
            setCurrentIndex(parseInt(e.target.value));
            setIsPlaying(false);
          }}
          className="w-32"
        />
        <span className="text-xs text-zinc-500">
          {frames[currentIndex]?.year}
        </span>
      </div>
    </div>
  );
}
