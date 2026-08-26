import type { CitizenProfile, DigilockerDocument, LifeEventEntities } from "@/lib/types";

export interface SourceContext {
  docs: DigilockerDocument[];
  profile: CitizenProfile;
  entities: LifeEventEntities;
}

/**
 * Resolve a deterministic source reference to a display value.
 * "aadhaar.name" | "entity:employerName" | "profile:state"
 */
export function resolveSource(source: string, ctx: SourceContext): string | undefined {
  if (source.startsWith("entity:")) {
    return ctx.entities[source.slice(7)];
  }
  if (source.startsWith("profile:")) {
    const v = (ctx.profile as unknown as Record<string, unknown>)[source.slice(8)];
    return v === undefined || v === null ? undefined : String(v);
  }
  const [docPart, fieldPart] = source.split(".");
  const doc = ctx.docs.find((d) => d.type.toLowerCase().replace(/_/g, "") === docPart.toLowerCase());
  return doc?.fields[fieldPart];
}

/** Flatten everything the citizen has consented to share — input for the autofill model. */
export function collectAvailableData(ctx: SourceContext): Record<string, string> {
  const data: Record<string, string> = {};
  for (const d of ctx.docs) {
    for (const [k, v] of Object.entries(d.fields)) {
      data[`${d.type.toLowerCase()}.${k}`] = v;
    }
  }
  data["profile.name"] = ctx.profile.name;
  data["profile.state"] = ctx.profile.state;
  data["profile.age"] = String(ctx.profile.age);
  data["profile.occupation"] = ctx.profile.occupation;
  for (const [k, v] of Object.entries(ctx.entities)) {
    if (v) data[`entity.${k}`] = v;
  }
  return data;
}
