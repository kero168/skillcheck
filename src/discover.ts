import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const IGNORED_DIRS = new Set(["node_modules", ".git", "dist", "coverage", "__pycache__"]);

/** Recursively find every SKILL.md under a root directory (sorted). */
export function discoverSkills(root: string): string[] {
  const out: string[] = [];
  walk(resolve(root), out);
  return out.sort();
}

function walk(dir: string, out: string[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walk(join(dir, entry.name), out);
      }
    } else if (entry.isFile() && entry.name === "SKILL.md") {
      out.push(join(dir, entry.name));
    }
  }
}
