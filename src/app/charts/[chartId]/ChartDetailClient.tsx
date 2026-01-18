"use client";

import { useState } from "react";
import Link from "next/link";
import ChartRenderer from "@/components/ChartRenderer";
import { ChartType } from "@/lib/chartConfig";

interface ChartDetailClientProps {
  chart: ChartType;
}

export default function ChartDetailClient({ chart }: ChartDetailClientProps) {
  const [data, setData] = useState(chart.defaultData);
  const [jsonText, setJsonText] = useState(
    JSON.stringify(chart.defaultData, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setData(parsed);
      setError(null);
    } catch {
      setError("Invalid JSON. Please check your syntax.");
    }
  };

  const handleReset = () => {
    setData(chart.defaultData);
    setJsonText(JSON.stringify(chart.defaultData, null, 2));
    setError(null);
  };

  return (
    <div className="min-h-screen p-8 sm:p-12">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-8 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Gallery
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {chart.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {chart.description}
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chart Preview
            </h2>
            <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <ChartRenderer
                chartType={chart.id}
                data={data}
                width={450}
                height={350}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Edit Data (JSON)
            </h2>

            <div className="relative">
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full h-[320px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 dark:text-white"
                spellCheck={false}
              />
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Update Chart
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Data Format
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {getDataFormatDescription(chart.id)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDataFormatDescription(chartType: string): string {
  switch (chartType) {
    case "bar":
      return 'Array of objects with "label" (string) and "value" (number) properties.';
    case "line":
    case "area":
      return 'Array of objects with "x" (number) and "y" (number) properties.';
    case "pie":
    case "donut":
      return 'Array of objects with "label" (string) and "value" (number) properties.';
    case "scatter":
      return 'Array of objects with "x" (number) and "y" (number) properties.';
    case "treemap":
      return 'Hierarchical object with "name" (string), optional "value" (number), and optional "children" (array of nested objects).';
    default:
      return "Check the default data structure for the expected format.";
  }
}
