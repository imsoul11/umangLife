"use client";

import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TaskInstance } from "@/lib/types";
import { computeUrgency } from "@/lib/engine";
import { StatusBadge } from "./Dashboard";

/** Group tasks into topological layers (row 0 = roots, each row unlocks after the one above). */
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

const NODE_W = 240;
const NODE_H = 92;
const GAP_X = 28;
const GAP_Y = 56;

type TaskNodeData = { task: TaskInstance };
function TaskNode({ data }: NodeProps) {
  const { task } = data as unknown as TaskNodeData;
  const style =
    task.status === "done"
      ? "border-emerald-400 bg-emerald-50"
      : task.status === "ready"
        ? "border-orange-500 bg-white shadow-md shadow-orange-100 ring-2 ring-orange-200 animate-pulse-border"
        : task.status === "action_required"
          ? "border-amber-400 bg-amber-50"
          : task.status === "in_progress"
            ? "border-yellow-400 bg-yellow-50"
            : "border-slate-200 bg-slate-50 border-dashed opacity-70";

  return (
    <div className={`w-[240px] rounded-xl border-2 ${style} bg-clip-padding`}>
      <Handle type="target" position={Position.Top} className="!bg-slate-300" />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <StatusBadge status={task.status} />
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
            {task.service.replace("_", " ")}
          </span>
        </div>
        <p className={`text-[12px] font-medium leading-snug ${task.status === "done" ? "text-emerald-800 line-through decoration-emerald-400" : "text-slate-700"}`}>
          {task.title}
        </p>
        {task.applicationRef && (
          <p className="mt-1 text-[10px] text-blue-600 font-medium">📄 {task.applicationRef}</p>
        )}
        {task.status === "action_required" && (
          <p className="mt-1 text-[10px] text-amber-600 font-medium">⚠️ document missing</p>
        )}
        {(() => {
          const u = computeUrgency(task);
          return u ? <p className="mt-1 text-[10px] font-medium text-slate-500">{u.chip}</p> : null;
        })()}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300" />
    </div>
  );
}

const nodeTypes = { task: TaskNode };

export default function JourneyGraph({
  tasks,
  onSelect,
}: {
  tasks: TaskInstance[];
  onSelect: (t: TaskInstance) => void;
}) {
  const [view, setView] = useState<"graph" | "list">("graph");

  const { nodes, edges } = useMemo(() => {
    const layers = getLayers(tasks);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const statusOf = new Map(tasks.map((t) => [t.id, t.status]));

    layers.forEach((layer) => {
      const rowWidth = layer.length * NODE_W + (layer.length - 1) * GAP_X;
      const startX = -(rowWidth / 2);
      layer.forEach((task, col) => {
        nodes.push({
          id: task.id,
          type: "task",
          position: { x: startX + col * (NODE_W + GAP_X), y: 0 },
          data: { task },
          draggable: true,
        });
      });
    });

    // vertical offset per layer index
    let y = 0;
    const yByLayer: number[] = [];
    for (let i = 0; i < layers.length; i++) {
      yByLayer.push(y);
      y += NODE_H + GAP_Y;
    }
    // apply y positions by recomputing layer membership
    const layerIndex = new Map<string, number>();
    layers.forEach((layer, li) => layer.forEach((t) => layerIndex.set(t.id, li)));
    for (const n of nodes) {
      n.position.y = yByLayer[layerIndex.get(n.id)!];
    }

    for (const t of tasks) {
      for (const dep of t.dependsOn) {
        const srcDone = statusOf.get(dep) === "done";
        edges.push({
          id: `${dep}->${t.id}`,
          source: dep,
          target: t.id,
          animated: srcDone && statusOf.get(t.id) === "ready",
          style: {
            stroke: srcDone ? "#f97316" : "#cbd5e1",
            strokeWidth: srcDone ? 2 : 1.5,
            strokeDasharray: srcDone ? undefined : "5 4",
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: srcDone ? "#f97316" : "#cbd5e1" },
        });
      }
    }
    return { nodes, edges };
  }, [tasks]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your Journey Graph</h3>
        <div className="flex gap-1 text-xs">
          {(["graph", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 rounded-full transition ${
                view === v ? "bg-orange-600 text-white" : "bg-slate-100 text-slate-500 hover:text-slate-700"
              }`}
            >
              {v === "graph" ? "⬡ Graph" : "☰ List"}
            </button>
          ))}
        </div>
      </div>

      {view === "graph" ? (
        <div className="h-[520px] rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => {
              const t = tasks.find((x) => x.id === node.id);
              if (t && t.status !== "locked") onSelect(t);
            }}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            proOptions={{ hideAttribution: true }}
            minZoom={0.4}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#e2e8f0" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      ) : (
        <ListView tasks={tasks} onSelect={onSelect} />
      )}

      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
        <span>━━ done → ready (unlocks)</span>
        <span>╌ ╌ locked dependency</span>
        <span className="text-orange-500">pulse = act now</span>
        <span>drag nodes · scroll to zoom · drag canvas to pan</span>
      </div>
    </div>
  );
}

/* simple list fallback */
function ListView({ tasks, onSelect }: { tasks: TaskInstance[]; onSelect: (t: TaskInstance) => void }) {
  return (
    <div className="space-y-2">
      {getLayers(tasks).map((layer, i) => (
        <div key={i}>
          {i > 0 && <div className="flex justify-center py-0.5 text-slate-300 text-xs select-none">↓</div>}
          <div className={`grid gap-2 ${layer.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {layer.map((task) => (
              <button
                key={task.id}
                onClick={() => task.status !== "locked" && onSelect(task)}
                disabled={task.status === "locked"}
                className={`text-left rounded-xl border p-3.5 w-full ${
                  task.status === "done"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : task.status === "ready"
                      ? "border-orange-400 bg-white shadow-sm hover:shadow-md cursor-pointer"
                      : task.status === "action_required"
                        ? "border-amber-300 bg-amber-50/60 cursor-pointer"
                        : task.status === "in_progress"
                          ? "border-yellow-300 bg-yellow-50/60 cursor-pointer"
                          : "border-dashed border-slate-200 bg-slate-100/60 opacity-70 cursor-not-allowed"
                }`}
              >
                <p className={`text-sm font-medium ${task.status === "done" ? "text-emerald-800 line-through" : "text-slate-800"}`}>
                  {task.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
