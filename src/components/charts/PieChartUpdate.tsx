"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface PieUpdateData {
  label: string;
  value: number;
}

interface PieChartUpdateProps {
  initialData: PieUpdateData[];
  width?: number;
  height?: number;
}

export default function PieChartUpdate({
  initialData,
  width = 500,
  height = 350,
}: PieChartUpdateProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState(initialData);

  const radius = Math.min(width, height) / 2 - 40;
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

  const updateChart = useCallback(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    const pie = d3
      .pie<PieUpdateData>()
      .value((d) => d.value)
      .sort(null)
      .padAngle(0.02);

    const arc = d3
      .arc<d3.PieArcDatum<PieUpdateData>>()
      .innerRadius(0)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcLabel = d3
      .arc<d3.PieArcDatum<PieUpdateData>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    const arcs = pie(data);

    // Update paths with transition
    const paths = svg
      .select<SVGGElement>(".slices")
      .selectAll<SVGPathElement, d3.PieArcDatum<PieUpdateData>>("path")
      .data(arcs, (d) => d.data.label);

    // Store previous angles for interpolation
    const prevAngles = new Map<string, d3.PieArcDatum<PieUpdateData>>();
    svg
      .select<SVGGElement>(".slices")
      .selectAll<SVGPathElement, d3.PieArcDatum<PieUpdateData>>("path")
      .each(function (d) {
        prevAngles.set(d.data.label, { ...d });
      });

    paths
      .enter()
      .append("path")
      .attr("fill", (d) => colorScale(d.data.label))
      .each(function (d) {
        (this as SVGPathElement & { _current: d3.PieArcDatum<PieUpdateData> })._current = {
          ...d,
          startAngle: d.startAngle,
          endAngle: d.startAngle,
        };
      })
      .merge(paths)
      .transition()
      .duration(750)
      .attrTween("d", function (d) {
        const elem = this as SVGPathElement & { _current: d3.PieArcDatum<PieUpdateData> };
        const prev = elem._current || prevAngles.get(d.data.label) || { startAngle: 0, endAngle: 0 };
        const interpolate = d3.interpolate(prev, d);
        elem._current = d;
        return (t: number) => arc(interpolate(t)) ?? "";
      });

    paths.exit().remove();

    // Update labels
    const labels = svg
      .select<SVGGElement>(".labels")
      .selectAll<SVGTextElement, d3.PieArcDatum<PieUpdateData>>("text")
      .data(arcs, (d) => d.data.label);

    labels
      .enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "11px")
      .attr("font-weight", "500")
      .merge(labels)
      .transition()
      .duration(750)
      .attrTween("transform", function (d) {
        const prev = prevAngles.get(d.data.label) || d;
        const interpolate = d3.interpolate(prev, d);
        return (t: number) => `translate(${arcLabel.centroid(interpolate(t))})`;
      })
      .text((d) => (d.endAngle - d.startAngle > 0.3 ? d.data.label : ""));

    labels.exit().remove();
  }, [data, radius, colorScale]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    g.append("g").attr("class", "slices");
    g.append("g").attr("class", "labels");

    updateChart();
  }, [width, height, updateChart]);

  useEffect(() => {
    updateChart();
  }, [data, updateChart]);

  const randomizeData = () => {
    setData(
      data.map((d) => ({
        ...d,
        value: Math.max(5, Math.floor(Math.random() * 100)),
      }))
    );
  };

  const addSlice = () => {
    const letters = "GHIJKLMNOP".split("");
    const existingLabels = new Set(data.map((d) => d.label));
    const newLabel = letters.find((l) => !existingLabels.has(l));
    if (newLabel) {
      setData([...data, { label: newLabel, value: Math.floor(Math.random() * 50) + 20 }]);
    }
  };

  const removeSlice = () => {
    if (data.length > 2) {
      setData(data.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex gap-2">
        <button
          onClick={randomizeData}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          Randomize
        </button>
        <button
          onClick={addSlice}
          disabled={data.length >= 10}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          Add Slice
        </button>
        <button
          onClick={removeSlice}
          disabled={data.length <= 2}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          Remove Slice
        </button>
      </div>
    </div>
  );
}
