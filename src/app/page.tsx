import ChartCard from "@/components/ChartCard";
import { chartTypes } from "@/lib/chartConfig";

export default function Home() {
  return (
    <div className="min-h-screen p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            D3.js Chart Gallery
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
            Explore different chart types built with D3.js. Click on any card to
            view the chart and customize its data.
          </p>
        </header>

        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chartTypes.map((chart) => (
            <ChartCard
              key={chart.id}
              id={chart.id}
              name={chart.name}
              description={chart.description}
            />
          ))}
        </main>
      </div>
    </div>
  );
}
