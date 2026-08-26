"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatAction, ChatMessage } from "@/lib/types";

export default function ChatPanel({
  messages,
  thinking,
  onSend,
  onAction,
  samples,
  scopeLabel,
}: {
  messages: ChatMessage[];
  thinking: boolean;
  onSend: (t: string) => void;
  onAction?: (a: ChatAction) => void;
  samples: string[];
  scopeLabel?: string;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, thinking]);

  const submit = () => {
    if (!input.trim() || thinking) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Assistant</h3>
          {scopeLabel && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              focused: {scopeLabel}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500">One advisor · knows all your journeys</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] lg:min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-600 pt-10 space-y-2">
            <p className="text-3xl">💬</p>
            <p>Try: &ldquo;I bought a second-hand car&rdquo;</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`anim-rise space-y-1.5 ${m.role === "user" ? "flex flex-col items-end" : ""}`}>
            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} w-full`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user" ? "bg-orange-600 text-white rounded-br-md" : "bg-slate-100 text-slate-800 rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
            </div>
            {m.actions && m.actions.length > 0 && onAction && (
              <div className="flex flex-wrap gap-1.5">
                {m.actions.map((a) => (
                  <button
                    key={a.taskId + a.kind}
                    onClick={() => onAction(a)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-500 transition shadow-sm"
                  >
                    {a.kind === "open_form" ? "📋" : a.kind === "mark_done" ? "🚀" : "•"} {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="bg-slate-100 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm">
              <span className="animate-pulse">thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {samples.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {samples.slice(0, 2).map((s) => (
            <button
              key={s}
              onClick={() => onSend(s)}
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-800 hover:bg-orange-50 hover:text-orange-700 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-slate-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="What happened in your life?"
          className="flex-1 text-sm text-slate-900 bg-white placeholder:text-slate-500 px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          disabled={thinking}
        />
        <button
          onClick={submit}
          disabled={thinking || !input.trim()}
          className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}
