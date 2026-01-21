"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface PopulationAgeGroup {
  age: string;
  male: number;
  female: number;
}

export interface PopulationFrame {
  year: number;
  data: PopulationAgeGroup[];
}

interface PopulationPyramidProps {
  frames: PopulationFrame[];
  width?: number;
  height?: number;
}

export default function PopulationPyramid({
  frames,
  width = 500,
  height = 350,
}: PopulationPyramidProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const margin = { top: 30, right: 20, bottom: 30, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const midPoint = innerWidth / 2;

  // Calculate max population for consistent scale
  const maxPop = d3.max(frames.flatMap((f) => f.data.flatMap((d) => [d.male, d.female]))) ?? 0;

  const xScaleLeft = d3.scaleLinear().domain([0, maxPop]).range([midPoint - 20, 0]);
  const xScaleRight = d3.scaleLinear().domain([0, maxPop]).range([midPoint + 20, innerWidth]);

  const updateChart = useCallback(
    (frameIndex: number) => {
      if (!svgRef.current || !frames[frameIndex]) return;

      const svg = d3.select(svgRef.current);
      const frame = frames[frameIndex];

      const yScale = d3
        .scaleBand()
        .domain(frame.data.map((d) => d.age))
        .range([innerHeight, 0])
        .padding(0.1);

      // Update male bars (left side)
      const maleBars = svg
        .select<SVGGElement>(".male-bars")
        .selectAll<SVGRectElement, PopulationAgeGroup>("rect")
        .data(frame.data, (d) => d.age);

      maleBars
        .enter()
        .append("rect")
        .attr("x", margin.left + midPoint - 20)
        .attr("y", (d) => margin.top + (yScale(d.age) ?? 0))
        .attr("height", yScale.bandwidth())
        .attr("width", 0)
        .attr("fill", "#3b82f6")
        .attr("rx", 1)
        .merge(maleBars)
        .transition()
        .duration(300)
        .attr("x", (d) => margin.left + xScaleLeft(d.male))
        .attr("y", (d) => margin.top + (yScale(d.age) ?? 0))
        .attr("width", (d) => midPoint - 20 - xScaleLeft(d.male))
        .attr("height", yScale.bandwidth());

      maleBars.exit().remove();

      // Update female bars (right side)
      const femaleBars = svg
        .select<SVGGElement>(".female-bars")
        .selectAll<SVGRectElement, PopulationAgeGroup>("rect")
        .data(frame.data, (d) => d.age);

      femaleBars
        .enter()
        .append("rect")
        .attr("x", margin.left + midPoint + 20)
        .attr("y", (d) => margin.top + (yScale(d.age) ?? 0))
        .attr("height", yScale.bandwidth())
        .attr("width", 0)
        .attr("fill", "#ec4899")
        .attr("rx", 1)
        .merge(femaleBars)
        .transition()
        .duration(300)
        .attr("x", margin.left + midPoint + 20)
        .attr("y", (d) => margin.top + (yScale(d.age) ?? 0))
        .attr("width", (d) => xScaleRight(d.female) - midPoint - 20)
        .attr("height", yScale.bandwidth());

      femaleBars.exit().remove();

      // Update age labels
      const labels = svg
        .select<SVGGElement>(".age-labels")
        .selectAll<SVGTextElement, PopulationAgeGroup>("text")
        .data(frame.data, (d) => d.age);

      labels
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("font-size", "9px")
        .attr("fill", "currentColor")
        .merge(labels)
        .attr("x", margin.left + midPoint)
        .attr("y", (d) => margin.top + (yScale(d.age) ?? 0) + yScale.bandwidth() / 2 + 3)
        .text((d) => d.age);

      labels.exit().remove();

      // Update year label
      svg.select(".year-label").text(frame.year);
    },
    [frames, innerHeight, margin.left, margin.top, midPoint, xScaleLeft, xScaleRight]
  );

  useEffect(() => {
    if (!svgRef.current || !frames.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Male bars container
    svg.append("g").attr("class", "male-bars");

    // Female bars container
    svg.append("g").attr("class", "female-bars");

    // Age labels container
    svg.append("g").attr("class", "age-labels");

    // X-axis for male (left)
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
      .call(d3.axisBottom(xScaleLeft).ticks(4).tickFormat(d3.format(".0s")))
      .selectAll("text")
      .attr("fill", "currentColor");

    // X-axis for female (right)
    svg
      .append("g")
      .attr("transform", `translate(${margin.left},${height - margin.bottom})`)
      .call(d3.axisBottom(xScaleRight).ticks(4).tickFormat(d3.format(".0s")))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Style axis lines
    svg.selectAll(".domain, .tick line").attr("stroke", "currentColor").attr("opacity", 0.3);

    // Labels
    svg
      .append("text")
      .attr("x", margin.left + midPoint / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#3b82f6")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text("Male");

    svg
      .append("text")
      .attr("x", margin.left + midPoint + (innerWidth - midPoint) / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("fill", "#ec4899")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .text("Female");

    // Year label
    svg
      .append("text")
      .attr("class", "year-label")
      .attr("x", width - margin.right)
      .attr("y", margin.top + 20)
      .attr("text-anchor", "end")
      .attr("fill", "currentColor")
      .attr("font-size", "24px")
      .attr("font-weight", "bold")
      .attr("opacity", 0.3);

    updateChart(0);
  }, [frames, width, height, innerWidth, innerHeight, margin, midPoint, xScaleLeft, xScaleRight, updateChart]);

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
        <span className="text-xs text-zinc-500">{frames[currentIndex]?.year}</span>
      </div>
    </div>
  );
}
