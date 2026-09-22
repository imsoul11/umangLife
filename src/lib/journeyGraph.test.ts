import { describe, expect, it } from "vitest";
import { getLayers } from "@/lib/journeyGraph";
import type { TaskInstance } from "@/lib/types";

function task(id: string, dependsOn: string[] = []): TaskInstance {
  return { id, title: id, description: "", service: "EPFO", dependsOn, status: "locked" };
}

describe("getLayers", () => {
  it("puts roots in layer 0 and chains into successive layers", () => {
    const layers = getLayers([task("a"), task("b", ["a"]), task("c", ["b"])]);
    expect(layers.map((l) => l.map((t) => t.id))).toEqual([["a"], ["b"], ["c"]]);
  });

  it("keeps parallel roots and siblings in the same layer", () => {
    const layers = getLayers([task("a"), task("b"), task("c", ["a"]), task("d", ["a"])]);
    expect(layers[0].map((t) => t.id)).toEqual(["a", "b"]);
    expect(layers[1].map((t) => t.id)).toEqual(["c", "d"]);
  });

  it("handles diamonds via the deepest path", () => {
    const layers = getLayers([
      task("a"),
      task("b", ["a"]),
      task("c", ["a"]),
      task("d", ["b", "c"]),
    ]);
    expect(layers.map((l) => l.map((t) => t.id))).toEqual([["a"], ["b", "c"], ["d"]]);
  });

  it("treats unknown dependencies as roots instead of crashing", () => {
    const layers = getLayers([task("a", ["ghost"])]);
    expect(layers[0].map((t) => t.id)).toContain("a");
  });

  it("survives dependency cycles without crashing", () => {
    const layers = getLayers([task("a", ["b"]), task("b", ["a"]), task("c")]);
    expect(layers.length).toBeGreaterThan(0);
    expect(layers.flat().map((t) => t.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("returns one empty-ish layer array for an empty journey", () => {
    expect(getLayers([])).toEqual([[]]);
  });
});