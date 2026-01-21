"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface GrowthMapLocation {
  id: string;
  name: string;
  x: number;
  y: number;
  date: string;
  size?: number;
}

interface GrowthMapProps {
  locations: GrowthMapLocation[];
  width?: number;
  height?: number;
}

export default function GrowthMap({
  locations,
  width = 500,
  height = 350,
}: GrowthMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dateIndex, setDateIndex] = useState(0);

  // Get unique sorted dates
  const dates = Array.from(new Set(locations.map((l) => l.date))).sort();

  const updateMap = useCallback(
    (targetDate: string) => {
      if (!svgRef.current) return;

      const svg = d3.select(svgRef.current);
      const visibleLocations = locations.filter((l) => l.date <= targetDate);

      // Update dots
      const dots = svg
        .select<SVGGElement>(".dots")
        .selectAll<SVGCircleElement, GrowthMapLocation>("circle")
        .data(visibleLocations, (d) => d.id);

      dots
        .enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", 0)
        .attr("fill", "#ef4444")
        .attr("fill-opacity", 0.6)
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 1)
        .transition()
        .duration(300)
        .attr("r", (d) => d.size ?? 4);

      dots.exit().remove();

      // Update date label
      svg.select(".date-label").text(targetDate);

      // Update count label
      svg.select(".count-label").text(`${visibleLocations.length} locations`);
    },
    [locations]
  );

  useEffect(() => {
    if (!svgRef.current || !locations.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Background map area
    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "currentColor")
      .attr("fill-opacity", 0.03)
      .attr("rx", 4);

    // Grid
    const gridGroup = svg.append("g").attr("class", "grid");
    const gridSize = 50;

    for (let x = gridSize; x < width; x += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", x)
        .attr("y1", 0)
        .attr("x2", x)
        .attr("y2", height)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1);
    }

    for (let y = gridSize; y < height; y += gridSize) {
      gridGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", width)
        .attr("y2", y)
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0.1);
    }

    // Dots container
    svg.append("g").attr("class", "dots");

    // Date label
    svg
      .append("text")
      .attr("class", "date-label")
      .attr("x", width - 10)
      .attr("y", 25)
      .attr("text-anchor", "end")
      .attr("fill", "currentColor")
      .attr("font-size", "18px")
      .attr("font-weight", "bold")
      .attr("opacity", 0.5);

    // Count label
    svg
      .append("text")
      .attr("class", "count-label")
      .attr("x", width - 10)
      .attr("y", 45)
      .attr("text-anchor", "end")
      .attr("fill", "currentColor")
      .attr("font-size", "12px")
      .attr("opacity", 0.5);

    if (dates[0]) {
      setCurrentDate(dates[0]);
      updateMap(dates[0]);
    }
  }, [locations, width, height, dates, updateMap]);

  useEffect(() => {
    if (currentDate) {
      updateMap(currentDate);
    }
  }, [currentDate, updateMap]);

  useEffect(() => {
    if (!isPlaying || dates.length <= 1) return;

    const interval = setInterval(() => {
      setDateIndex((prev) => {
        const next = (prev + 1) % dates.length;
        setCurrentDate(dates[next]);
        return next;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isPlaying, dates]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    setDateIndex(index);
    setCurrentDate(dates[index]);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex flex-col gap-2 w-full px-4">
        <input
          type="range"
          min={0}
          max={dates.length - 1}
          value={dateIndex}
          onChange={handleSliderChange}
          className="w-full"
        />
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => {
              setDateIndex(0);
              setCurrentDate(dates[0]);
            }}
            className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Reset
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
      </div>
    </div>
  );
}
