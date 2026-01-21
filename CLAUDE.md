# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Architecture

This is a Next.js 15 + D3.js chart gallery application using the App Router, React 19, and Tailwind CSS 4.

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page - displays chart gallery grid
│   └── charts/[chartId]/  # Dynamic route for individual chart views
├── components/
│   ├── charts/            # D3.js chart components (BarChart, LineChart, etc.)
│   ├── ChartRenderer.tsx  # Routes chart type to appropriate chart component
│   └── ChartCard.tsx      # Card component for gallery grid
└── lib/
    └── chartConfig.ts     # Chart type definitions and default data
```

### Key Patterns

- **Chart Components**: Each chart in `src/components/charts/` is a client component using `useRef` + `useEffect` to render D3 visualizations into an SVG element. The pattern clears the SVG on each render before drawing.

- **Chart Registry**: `src/lib/chartConfig.ts` defines all available chart types with their IDs, names, descriptions, and default sample data. Add new charts here and in the charts barrel export.

- **ChartRenderer**: Switch-based component that maps chart type IDs to their React components. Update this when adding new chart types.

- **Path Alias**: Use `@/*` to import from `src/*` (configured in tsconfig.json).
