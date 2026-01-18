import Link from "next/link";

interface ChartCardProps {
  id: string;
  name: string;
  description: string;
}

export default function ChartCard({ id, name, description }: ChartCardProps) {
  return (
    <Link href={`/charts/${id}`}>
      <div className="group border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-gray-900">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ChartIcon type={id} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {name}
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {description}
        </p>
      </div>
    </Link>
  );
}

function ChartIcon({ type }: { type: string }) {
  const iconClass = "w-5 h-5 text-blue-600 dark:text-blue-400";

  switch (type) {
    case "bar":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-8h-4v8z" />
        </svg>
      );
    case "line":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
        </svg>
      );
    case "pie":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8v8l6.93 3.47A7.96 7.96 0 0 1 12 20z" />
        </svg>
      );
    case "scatter":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <circle cx="7" cy="14" r="2" />
          <circle cx="11" cy="8" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="14" cy="18" r="2" />
          <circle cx="19" cy="6" r="2" />
        </svg>
      );
    case "donut":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
        </svg>
      );
    case "area":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 18h18v2H3v-2zm0-2l6-6 4 3 8-8v8H3v3z" opacity={0.6} />
          <path d="M3 13l6-6 4 3 8-8" fill="none" stroke="currentColor" strokeWidth={2} />
        </svg>
      );
    case "treemap":
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="8" height="10" rx="1" />
          <rect x="13" y="3" width="8" height="6" rx="1" opacity={0.7} />
          <rect x="13" y="11" width="8" height="10" rx="1" opacity={0.5} />
          <rect x="3" y="15" width="8" height="6" rx="1" opacity={0.7} />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 20h4V10H4v10zm6 0h4V4h-4v16zm6 0h4v-8h-4v8z" />
        </svg>
      );
  }
}
