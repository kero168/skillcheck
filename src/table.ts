const ANSI_RE = /\u001b\[[0-9;]*m/g;

function visibleLength(value: string): number {
  return value.replace(ANSI_RE, "").length;
}

function pad(value: string, width: number): string {
  return value + " ".repeat(Math.max(0, width - visibleLength(value)));
}

/** Render a minimal aligned text table (ANSI-color aware). */
export function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, i) =>
    Math.max(visibleLength(header), ...rows.map((row) => visibleLength(row[i] ?? "")))
  );
  const line = (cells: string[]): string =>
    cells.map((cell, i) => pad(cell, widths[i] ?? 0)).join("  ").trimEnd();
  const separator = widths.map((width) => "-".repeat(width)).join("  ");
  return [line(headers), separator, ...rows.map(line)].join("\n");
}
