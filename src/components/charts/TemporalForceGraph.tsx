"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";

export interface ForceGraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
}

export interface ForceGraphLink extends d3.SimulationLinkDatum<ForceGraphNode> {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  value: number;
}

export interface TemporalGraphFrame {
  date: string;
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

interface TemporalForceGraphProps {
  frames: TemporalGraphFrame[];
  width?: number;
  height?: number;
}

export default function TemporalForceGraph({
  frames,
  width = 500,
  height = 350,
}: TemporalForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const simulationRef = useRef<d3.Simulation<ForceGraphNode, ForceGraphLink> | null>(null);

  const allGroups = Array.from(new Set(frames.flatMap((f) => f.nodes.map((n) => n.group))));
  const colorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(allGroups.map(String));

  const updateGraph = useCallback(
    (frameIndex: number) => {
      if (!svgRef.current || !frames[frameIndex]) return;

      const svg = d3.select(svgRef.current);
      const frame = frames[frameIndex];

      // Deep copy nodes to preserve simulation state
      const nodes: ForceGraphNode[] = frame.nodes.map((n) => ({ ...n }));
      const links: ForceGraphLink[] = frame.links.map((l) => ({
        ...l,
        source: typeof l.source === "string" ? l.source : l.source.id,
        target: typeof l.target === "string" ? l.target : l.target.id,
      }));

      // Stop previous simulation
      if (simulationRef.current) {
        simulationRef.current.stop();
      }

      // Create new simulation
      const simulation = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink<ForceGraphNode, ForceGraphLink>(links)
            .id((d) => d.id)
            .distance(50)
        )
        .force("charge", d3.forceManyBody().strength(-100))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(15));

      simulationRef.current = simulation;

      // Update links
      const link = svg
        .select<SVGGElement>(".links")
        .selectAll<SVGLineElement, ForceGraphLink>("line")
        .data(links, (d) => `${(d.source as ForceGraphNode).id ?? d.source}-${(d.target as ForceGraphNode).id ?? d.target}`);

      link.exit().transition().duration(300).attr("stroke-opacity", 0).remove();

      const linkEnter = link
        .enter()
        .append("line")
        .attr("stroke", "currentColor")
        .attr("stroke-opacity", 0)
        .attr("stroke-width", (d) => Math.sqrt(d.value));

      linkEnter.transition().duration(300).attr("stroke-opacity", 0.4);

      const linkMerged = linkEnter.merge(link);

      // Update nodes
      const node = svg
        .select<SVGGElement>(".nodes")
        .selectAll<SVGCircleElement, ForceGraphNode>("circle")
        .data(nodes, (d) => d.id);

      node.exit().transition().duration(300).attr("r", 0).remove();

      const nodeEnter = node
        .enter()
        .append("circle")
        .attr("r", 0)
        .attr("fill", (d) => colorScale(String(d.group)))
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .call(
          d3
            .drag<SVGCircleElement, ForceGraphNode>()
            .on("start", (event, d) => {
              if (!event.active) simulation.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (event, d) => {
              d.fx = event.x;
              d.fy = event.y;
            })
            .on("end", (event, d) => {
              if (!event.active) simulation.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        );

      nodeEnter.transition().duration(300).attr("r", 8);

      const nodeMerged = nodeEnter.merge(node);

      // Update labels
      const label = svg
        .select<SVGGElement>(".labels")
        .selectAll<SVGTextElement, ForceGraphNode>("text")
        .data(nodes, (d) => d.id);

      label.exit().remove();

      const labelEnter = label
        .enter()
        .append("text")
        .attr("font-size", "9px")
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .attr("dy", -12)
        .text((d) => d.id);

      const labelMerged = labelEnter.merge(label);

      // Update date label
      svg.select(".date-label").text(frame.date);

      // Simulation tick
      simulation.on("tick", () => {
        linkMerged
          .attr("x1", (d) => ((d.source as ForceGraphNode).x ?? 0))
          .attr("y1", (d) => ((d.source as ForceGraphNode).y ?? 0))
          .attr("x2", (d) => ((d.target as ForceGraphNode).x ?? 0))
          .attr("y2", (d) => ((d.target as ForceGraphNode).y ?? 0));

        nodeMerged
          .attr("cx", (d) => d.x ?? 0)
          .attr("cy", (d) => d.y ?? 0);

        labelMerged
          .attr("x", (d) => d.x ?? 0)
          .attr("y", (d) => d.y ?? 0);
      });
    },
    [frames, colorScale, width, height]
  );

  useEffect(() => {
    if (!svgRef.current || !frames.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    svg.append("g").attr("class", "links");
    svg.append("g").attr("class", "nodes");
    svg.append("g").attr("class", "labels");

    svg
      .append("text")
      .attr("class", "date-label")
      .attr("x", width / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("font-size", "14px")
      .attr("font-weight", "bold");

    updateGraph(0);

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [frames, width, height, updateGraph]);

  useEffect(() => {
    updateGraph(currentIndex);
  }, [currentIndex, updateGraph]);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
          disabled={currentIndex === 0}
          className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          ←
        </button>
        <button
          onClick={() => {
            if (currentIndex === frames.length - 1) {
              setCurrentIndex(0);
            }
            setIsPlaying(!isPlaying);
          }}
          className="px-3 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => setCurrentIndex((p) => Math.min(frames.length - 1, p + 1))}
          disabled={currentIndex === frames.length - 1}
          className="px-2 py-1 text-xs bg-zinc-200 dark:bg-zinc-700 rounded hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
        >
          →
        </button>
        <span className="text-xs text-zinc-500">
          {currentIndex + 1} / {frames.length}
        </span>
      </div>
    </div>
  );
}
