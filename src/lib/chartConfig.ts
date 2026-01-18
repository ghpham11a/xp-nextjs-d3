export interface ChartType {
  id: string;
  name: string;
  description: string;
  defaultData: unknown;
}

export const chartTypes: ChartType[] = [
  {
    id: "bar",
    name: "Bar Chart",
    description: "Compare values across categories using rectangular bars",
    defaultData: [
      { label: "A", value: 30 },
      { label: "B", value: 80 },
      { label: "C", value: 45 },
      { label: "D", value: 60 },
      { label: "E", value: 20 },
      { label: "F", value: 90 },
    ],
  },
  {
    id: "line",
    name: "Line Chart",
    description: "Show trends over time with connected data points",
    defaultData: [
      { x: 0, y: 30 },
      { x: 1, y: 50 },
      { x: 2, y: 35 },
      { x: 3, y: 65 },
      { x: 4, y: 45 },
      { x: 5, y: 80 },
      { x: 6, y: 60 },
    ],
  },
  {
    id: "pie",
    name: "Pie Chart",
    description: "Display proportions of a whole as slices",
    defaultData: [
      { label: "Red", value: 30 },
      { label: "Blue", value: 25 },
      { label: "Green", value: 20 },
      { label: "Yellow", value: 15 },
      { label: "Purple", value: 10 },
    ],
  },
  {
    id: "scatter",
    name: "Scatter Plot",
    description: "Show relationships between two variables as points",
    defaultData: [
      { x: 10, y: 20 },
      { x: 25, y: 45 },
      { x: 35, y: 30 },
      { x: 45, y: 60 },
      { x: 55, y: 40 },
      { x: 65, y: 75 },
      { x: 75, y: 55 },
      { x: 85, y: 90 },
    ],
  },
  {
    id: "donut",
    name: "Donut Chart",
    description: "A pie chart with a hollow center for additional info",
    defaultData: [
      { label: "Mobile", value: 45 },
      { label: "Desktop", value: 35 },
      { label: "Tablet", value: 20 },
    ],
  },
  {
    id: "area",
    name: "Area Chart",
    description: "Show cumulative totals over time with filled areas",
    defaultData: [
      { x: 0, y: 20 },
      { x: 1, y: 40 },
      { x: 2, y: 35 },
      { x: 3, y: 55 },
      { x: 4, y: 45 },
      { x: 5, y: 70 },
      { x: 6, y: 60 },
    ],
  },
  {
    id: "treemap",
    name: "Treemap",
    description: "Display hierarchical data as nested rectangles sized by value",
    defaultData: {
      name: "Company",
      children: [
        {
          name: "Engineering",
          children: [
            { name: "Frontend", value: 120 },
            { name: "Backend", value: 150 },
            { name: "DevOps", value: 80 },
            { name: "QA", value: 60 },
          ],
        },
        {
          name: "Product",
          children: [
            { name: "Design", value: 90 },
            { name: "Research", value: 50 },
            { name: "Management", value: 40 },
          ],
        },
        {
          name: "Sales",
          children: [
            { name: "Enterprise", value: 100 },
            { name: "SMB", value: 70 },
            { name: "Partners", value: 45 },
          ],
        },
        {
          name: "Operations",
          children: [
            { name: "HR", value: 35 },
            { name: "Finance", value: 40 },
            { name: "Legal", value: 25 },
          ],
        },
      ],
    },
  },
];

export function getChartById(id: string): ChartType | undefined {
  return chartTypes.find((chart) => chart.id === id);
}
