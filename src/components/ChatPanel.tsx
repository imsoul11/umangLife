"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatAction, ChatMessage } from "@/lib/types";
import ChatErrorBanner from "@/components/ChatErrorBanner";
import { useLocale } from "@/components/LocaleProvider";

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
  const { t } = useLocale();
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
    <div className="card-ink h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3.5 border-b border-white/10 bg-gradient-to-r from-saffron/[0.12] via-transparent to-transparent">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="relative flex h-2 w-2" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jade opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-jade" />
            </span>
            {t("chat.title")}
          </h3>
          {scopeLabel && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/80 ring-1 ring-white/15">
              {t("chat.focused", { s: scopeLabel })}
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/50">{t("chat.subtitle")}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] lg:min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-sm text-white/70 pt-10 space-y-2">
            <p className="text-3xl">💬</p>
            <p>{t("chat.try")}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`anim-rise space-y-1.5 ${m.role === "user" ? "flex flex-col items-end" : ""}`}>
            <div className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} w-full`}>
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-saffron to-saffron-deep text-white shadow-md shadow-black/30 rounded-br-md"
                    : "bg-white/[0.08] text-slate-100 ring-1 ring-white/10 rounded-bl-md"
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
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 hover:-translate-y-px transition"
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
            <div className="bg-white/[0.08] ring-1 ring-white/10 text-white/70 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm flex items-center gap-2.5">
              <span className="flex gap-1" aria-hidden>
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-saffron" />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-saffron" style={{ animationDelay: "150ms" }} />
                <span className="typing-dot w-1.5 h-1.5 rounded-full bg-saffron" style={{ animationDelay: "300ms" }} />
              </span>
              {t("chat.thinking")}
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
              className="text-[11px] font-medium px-2.5 py-1.5 rounded-full bg-white/10 text-white/85 ring-1 ring-white/15 hover:bg-white/20 hover:-translate-y-px transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <ChatErrorBanner />

      <div className="p-3 border-t border-white/10 bg-white/[0.04] flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("chat.placeholder")}
          className="flex-1 text-sm text-white bg-white/10 placeholder:text-white/40 px-4 py-2.5 rounded-xl ring-1 ring-white/15 focus:outline-none focus:bg-white/15 focus:ring-2 focus:ring-saffron/60 transition"
          disabled={thinking}
        />
        <button
          onClick={submit}
          disabled={thinking || !input.trim()}
          className="btn-primary px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:bg-white/10 disabled:bg-none disabled:text-white/30 disabled:shadow-none"
        >
          {t("chat.send")}
        </button>
      </div>
    </div>
  );
}