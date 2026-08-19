/**
 * Hex mirrors of `src/styles/design-tokens.css`.
 *
 * Use ONLY where CSS variables cannot apply (Next metadata, static SVG/ICO).
 * When you change `lab()` in the CSS carta, update these hex values to match
 * (and regenerate favicons if needed).
 */
export const designTokenHex = {
  primary: "#c6582a",
  primaryForeground: "#fcf8f0",
  background: "#fcf8f0",
  foreground: "#2c241c",
  /** Chart series — mirrors `--color-chart-*` for Recharts (no CSS vars in SVG attrs). */
  chart1: "#c6582a",
  chart2: "#2f6b4a",
  chart3: "#c4892e",
  chart4: "#3d8a5a",
  chart5: "#4a3a32",
  muted: "#8a7f74",
  border: "#d9d0c6",
} as const
