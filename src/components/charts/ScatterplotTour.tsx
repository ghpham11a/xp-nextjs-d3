"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface ScatterTourPoint {
  x: number;
  y: number;
  category: string;
  label?: string;
}

export interface ScatterTourStep {
  name: string;
  xDomain: [number, number];
  yDomain: [number, number];
  highlight?: string; // category to highlight
}

interface ScatterplotTourProps {
  data: ScatterTourPoint[];
  steps: ScatterTourStep[];
  width?: number;
  height?: number;
}

export default function ScatterplotTour({
  data,
  steps,
  width = 500,
  height = 350,
}: ScatterplotTourProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const margin = { top: 30, right: 20, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const categories = Array.from(new Set(data.map((d) => d.category)));
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(categories);

  const updateView = useCallback(
    (stepIndex: number) => {
      if (!svgRef.current || !steps[stepIndex]) return;

      const svg = d3.select(svgRef.current);
      const step = steps[stepIndex];

      const xScale = d3.scaleLinear().domain(step.xDomain).range([0, innerWidth]);
      const yScale = d3.scaleLinear().domain(step.yDomain).range([innerHeight, 0]);

      // Update axes with transition
      svg
        .select<SVGGElement>(".x-axis")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(xScale).ticks(6));

      svg
        .select<SVGGElement>(".y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(yScale).ticks(6));

      // Update dots
      svg
        .selectAll<SVGCircleElement, ScatterTourPoint>(".dot")
        .transition()
        .duration(1000)
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("opacity", (d) => (step.highlight ? (d.category === step.highlight ? 1 : 0.2) : 0.8))
        .attr("r", (d) => (step.highlight && d.category === step.highlight ? 6 : 4));

      // Update step label
      svg.select(".step-label").text(step.name);
    },
    [steps, innerWidth, innerHeight]
  );

  useEffect(() => {
    if (!svgRef.current || !data.length || !steps.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const step = steps[0];
    const xScale = d3.scaleLinear().domain(step.xDomain).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(step.yDomain).range([innerHeight, 0]);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // X-axis
    g.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(6))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Y-axis
    g.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale).ticks(6))
      .selectAll("text")
      .attr("fill", "currentColor");

    // Style axis lines
    g.selectAll(".domain, .tick line").attr("stroke", "currentColor").attr("opacity", 0.3);

    // Draw dots
    g.selectAll(".dot")
      .data(data)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 4)
      .attr("fill", (d) => colorScale(d.category))
      .attr("opacity", 0.8)
      .attr("stroke", "white")
      .attr("stroke-width", 1);

    // Step label
    svg
      .append("text")
      .attr("class", "step-label")
      .attr("x", width / 2)
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "14px")
      .attr("font-weight", "600")
      .text(step.name);

    // Legend
    const legend = svg
      .append("g")
      .attr("transform", `translate(${width - margin.right - 70}, ${margin.top + 10})`);

    categories.forEach((cat, i) => {
      const lg = legend.append("g").attr("transform", `translate(0, ${i * 16})`);
      lg.append("circle").attr("r", 4).attr("cx", 5).attr("cy", 5).attr("fill", colorScale(cat));
      lg.append("text")
        .attr("x", 14)
        .attr("y", 9)
        .attr("font-size", "10px")
        .attr("fill", "currentColor")
        .text(cat);
    });
  }, [data, steps, width, height, innerWidth, innerHeight, margin.left, margin.top, margin.right, colorScale, categories]);

  useEffect(() => {
    updateView(currentStep);
  }, [currentStep, updateView]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
          disabled={currentStep === 0}
          className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          ←
        </button>
        <button
          onClick={() => {
            if (currentStep === steps.length - 1) {
              setCurrentStep(0);
            }
            setIsPlaying(!isPlaying);
          }}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPlaying ? "Pause" : "Play Tour"}
        </button>
        <button
          onClick={() => setCurrentStep((p) => Math.min(steps.length - 1, p + 1))}
          disabled={currentStep === steps.length - 1}
          className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          →
        </button>
        <span className="text-xs text-zinc-500">
          {currentStep + 1} / {steps.length}
        </span>
      </div>
    </div>
  );
}
