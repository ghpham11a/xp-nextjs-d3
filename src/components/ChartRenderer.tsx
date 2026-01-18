"use client";

import {
  BarChart,
  LineChart,
  PieChart,
  ScatterPlot,
  DonutChart,
  AreaChart,
  TreemapChart,
  type TreeNode,
} from "./charts";

interface ChartRendererProps {
  chartType: string;
  data: unknown;
  width?: number;
  height?: number;
}

export default function ChartRenderer({
  chartType,
  data,
  width = 500,
  height = 350,
}: ChartRendererProps) {
  switch (chartType) {
    case "bar":
      return (
        <BarChart
          data={data as { label: string; value: number }[]}
          width={width}
          height={height}
        />
      );
    case "line":
      return (
        <LineChart
          data={data as { x: number; y: number }[]}
          width={width}
          height={height}
        />
      );
    case "pie":
      return (
        <PieChart
          data={data as { label: string; value: number }[]}
          width={width}
          height={height}
        />
      );
    case "scatter":
      return (
        <ScatterPlot
          data={data as { x: number; y: number }[]}
          width={width}
          height={height}
        />
      );
    case "donut":
      return (
        <DonutChart
          data={data as { label: string; value: number }[]}
          width={width}
          height={height}
        />
      );
    case "area":
      return (
        <AreaChart
          data={data as { x: number; y: number }[]}
          width={width}
          height={height}
        />
      );
    case "treemap":
      return (
        <TreemapChart
          data={data as TreeNode}
          width={width}
          height={height}
        />
      );
    default:
      return <div>Unknown chart type: {chartType}</div>;
  }
}
