"use client";

import { useEffect } from "react";

/** Calls onClose when Escape is pressed while the modal is mounted. */
export function useEscapeClose(onClose: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);
}