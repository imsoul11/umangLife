import { NextResponse } from "next/server";
import { getStore, storeKind } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Liveness + storage connectivity probe for uptime checks. */
export async function GET() {
  const kind = storeKind();
  try {
    await getStore().set("__health__", new Date().toISOString());
    const ok = (await getStore().get("__health__")) !== null;
    await getStore().del("__health__");
    return NextResponse.json({ ok, store: kind, now: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, store: kind, error: err instanceof Error ? err.message : "store unreachable" },
      { status: 503 },
    );
  }
}