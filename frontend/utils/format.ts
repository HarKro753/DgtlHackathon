export function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function renewableColor(pct: number): string {
  if (pct >= 90) return "text-green-400";
  if (pct >= 60) return "text-yellow-400";
  return "text-red-400";
}

export function renewableBg(pct: number): string {
  if (pct >= 90) return "bg-green-900/30";
  if (pct >= 60) return "bg-yellow-900/30";
  return "bg-red-900/30";
}

export const SOURCE_COLORS: Record<string, string> = {
  "Grid (renewable)": "#22C55E",
  "Grid (fossil)": "#EF4444",
  Hydrogen: "#06B6D4",
  Battery: "#A855F7",
};
