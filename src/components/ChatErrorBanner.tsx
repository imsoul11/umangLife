"use client";

import { useJourneys } from "@/components/JourneyProvider";
import { useLocale } from "@/components/LocaleProvider";

const MESSAGE_KEY = {
  rate_limit: "chat.error.rate_limit",
  network: "chat.error.network",
  server: "chat.error.server",
} as const;

export default function ChatErrorBanner() {
  const { chatError, retryChat, dismissChatError, thinking } = useJourneys();
  const { t } = useLocale();
  if (!chatError) return null;
  return (
    <div className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-red-500/15 px-3 py-2 anim-rise ring-1 ring-red-400/30" role="alert">
      <span aria-hidden className="text-base">⚠️</span>
      <p className="flex-1 text-xs text-red-100 leading-snug">{t(MESSAGE_KEY[chatError.kind])}</p>
      <button
        onClick={retryChat}
        disabled={thinking}
        className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-500 text-white hover:bg-red-400 disabled:opacity-40 transition shrink-0"
      >
        {t("chat.error.retry")}
      </button>
      <button onClick={dismissChatError} className="text-[11px] text-red-200/80 hover:text-red-100 underline shrink-0">
        {t("chat.error.dismiss")}
      </button>
    </div>
  );
}
