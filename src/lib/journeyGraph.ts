import type { TaskInstance } from "@/lib/types";

/**
 * Group tasks into topological layers (row 0 = roots, each row unlocks after
 * the one above). Pure — unit-tested in journeyGraph.test.ts.
 */
export function getLayers(tasks: TaskInstance[]): TaskInstance[][] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const cache = new Map<string, number>();
  const depth = (t: TaskInstance, path: Set<string>): number => {
    if (cache.has(t.id)) return cache.get(t.id)!;
    if (path.has(t.id) || t.dependsOn.length === 0) {
      cache.set(t.id, 0);
      return 0;
    }
    const d =
      Math.max(
        ...t.dependsOn.map((dep) => {
          const parent = byId.get(dep);
          return parent ? depth(parent, new Set([...path, t.id])) : -1;
        }),
      ) + 1;
    cache.set(t.id, d);
    return d;
  };
  for (const t of tasks) depth(t, new Set());
  const max = Math.max(0, ...tasks.map((t) => depth(t, new Set())));
  const layers: TaskInstance[][] = Array.from({ length: max + 1 }, () => []);
  for (const t of tasks) layers[depth(t, new Set())].push(t);
  return layers;
}