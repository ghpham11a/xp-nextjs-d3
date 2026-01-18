import { notFound } from "next/navigation";
import { getChartById, chartTypes } from "@/lib/chartConfig";
import ChartDetailClient from "./ChartDetailClient";

interface PageProps {
  params: Promise<{ chartId: string }>;
}

export function generateStaticParams() {
  return chartTypes.map((chart) => ({
    chartId: chart.id,
  }));
}

export default async function ChartDetailPage({ params }: PageProps) {
  const { chartId } = await params;
  const chart = getChartById(chartId);

  if (!chart) {
    notFound();
  }

  return <ChartDetailClient chart={chart} />;
}
