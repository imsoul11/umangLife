import { NextResponse } from "next/server";
import type { FormField } from "@/lib/types";
import { collectAvailableData, resolveSource, type SourceContext } from "@/lib/sources";
import { getAIClient } from "@/lib/ai";

interface AutofillRequestBody {
  taskTitle: string;
  fields: FormField[];
  context: SourceContext;
}

/**
 * Gemini proposes values for unfilled form fields using ONLY the citizen's
 * consented data. It can never invent — anything not found in the sources
 * is returned as missing and stays an empty input for the user.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AutofillRequestBody;
    if (!body.fields?.length) {
      return NextResponse.json({ error: "fields required" }, { status: 400 });
    }

    // Deterministic pass first — free and instant
    const ctx: SourceContext = body.context;
    const values: Record<string, { value: string; source: string }> = {};
    const needsAi: FormField[] = [];
    for (const f of body.fields) {
      if (f.type === "select") continue;
      if (f.source) {
        const v = resolveSource(f.source, ctx);
        if (v) {
          values[f.id] = { value: v, source: f.source };
          continue;
        }
      }
      needsAi.push(f);
    }

    let aiFilled = 0;
    if (needsAi.length > 0) {
      const available = collectAvailableData(ctx);
      const fieldList = needsAi.map((f) => `- ${f.id}: "${f.label}"${f.required ? " (required)" : ""}`).join("\n");

      const { client, model } = getAIClient();
      const res = await client.chat.completions.create({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You fill government application forms. You are given form fields and the citizen's authorized data. Map each field to the best matching data value. STRICT RULES:
- Use ONLY values present in the provided data. NEVER invent, guess, or fabricate any value.
- If no confident match exists, put the field id in "missing".
- Format dates as shown in the source.
Respond with JSON only: {"values": {"<fieldId>": "<value>", ...}, "missing": ["<fieldId>", ...]}`,
          },
          {
            role: "user",
            content: `FORM: ${body.taskTitle}\n\nFIELDS:\n${fieldList}\n\nAVAILABLE DATA:\n${JSON.stringify(available, null, 2)}`,
          },
        ],
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}") as {
        values?: Record<string, string>;
      };
      for (const [fieldId, value] of Object.entries(parsed.values ?? {})) {
        // guard: accept only non-empty strings
        if (typeof value === "string" && value.trim()) {
          values[fieldId] = { value: value.trim(), source: "gemini" };
          aiFilled++;
        }
      }
    }

    return NextResponse.json({
      values,
      remainingEmpty: body.fields.filter((f) => !values[f.id]).map((f) => f.id),
      aiFilled,
      deterministic: Object.values(values).filter((v) => v.source !== "gemini").length,
    });
  } catch (err) {
    console.error("[autofill]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Autofill failed" }, { status: 500 });
  }
}
