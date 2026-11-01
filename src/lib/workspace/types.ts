import { z } from "zod";

export const TYPES = {
  overview: "Prehľad",
  rules: "Pravidlá",
  configuration: "Konfigurácia",
  documentation: "Dokumentácia",
  hardware: "Hardvér a zapojenie",
  decision: "Rozhodnutie",
  task: "Úloha",
  test: "Test a meranie",
  problem: "Problém a hypotéza",
  journal: "YouTube denník",
} as const;
export const VALIDITY = {
  verified: "OVERENÉ",
  proposal: "NÁVRH",
  unknown: "NEZNÁME",
  invalid: "NEPLATNÉ / NAHRADENÉ",
} as const;
export const EVIDENCE = {
  physical: "Fyzický test",
  simulation: "Simulácia",
  code: "Kontrola kódu",
  manufacturer: "Dokumentácia výrobcu",
  user: "Tvrdenie používateľa",
  agent: "Report agenta",
} as const;
export const TASK_STATUS = {
  open: "Otvorená",
  active: "Rozpracovaná",
  blocked: "Blokovaná",
  done: "Dokončená",
} as const;
const text = z.string().max(2000);
export const handoffSchema = z
  .object({
    changed: text.min(1),
    verified: text.min(1),
    uncertain: text,
    artifact: text,
    next: text.min(1),
  })
  .strict();
export const documentSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    type: z.enum(
      Object.keys(TYPES) as [keyof typeof TYPES, ...(keyof typeof TYPES)[]],
    ),
    content: z.string().max(180000),
    validity: z.enum(["verified", "proposal", "unknown", "invalid"]),
    evidence: z
      .array(
        z.enum([
          "physical",
          "simulation",
          "code",
          "manufacturer",
          "user",
          "agent",
        ]),
      )
      .max(6)
      .default([]),
    evidence_note: text.default(""),
    tags: z.array(z.string().max(80)).max(30).default([]),
    sources: z
      .array(
        z
          .object({
            label: z.string().max(200),
            uri: z.string().max(2000),
            hash: z.string().max(128).optional(),
            observed_at: z.string().max(100).optional(),
          })
          .strict(),
      )
      .max(40)
      .default([]),
    links: z.array(z.string().uuid()).max(50).default([]),
    replaces: z.string().uuid().optional(),
    replaced_by: z.string().uuid().optional(),
    claims: z
      .array(
        z.object({
          text: z.string().max(10000),
          validity: z.enum(["verified", "proposal", "unknown", "invalid"]),
          evidence: z.array(
            z.enum([
              "physical",
              "simulation",
              "code",
              "manufacturer",
              "user",
              "agent",
            ]),
          ),
          source_marker: z.string().max(100),
          observed_at: z.string().max(100),
        }),
      )
      .max(200)
      .default([]),
    task_status: z.enum(["open", "active", "blocked", "done"]).default("open"),
    assignee: z.string().max(200).default(""),
    area: z.string().max(200).default(""),
    files: z.array(z.string().max(500)).max(100).default([]),
    result: text.default(""),
    handoffs: z
      .array(
        handoffSchema.extend({
          at: z.string(),
          author_id: z.string().uuid(),
          connection_id: z.string().uuid().nullable(),
        }),
      )
      .max(200)
      .default([]),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (
      d.validity === "verified" &&
      (!d.evidence.length || !d.evidence_note.trim())
    )
      ctx.addIssue({
        code: "custom",
        message: "Uveď druh dôkazu a spôsob overenia.",
        path: ["evidence"],
      });
  });
export type DocumentData = z.infer<typeof documentSchema>;
export type WorkspaceDocument = {
  id: string;
  project_id: string;
  revision: number;
  data: DocumentData;
  updated_at: string;
  author_id: string;
  author_name: string;
  connection_id: string | null;
  connection_name: string | null;
  archived: boolean;
  claim_until: string | null;
  claimed_by: string | null;
  claimed_connection: string | null;
  excerpt?: string;
  source_key?: string;
};
export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  role: "owner" | "editor" | "reader";
};
export type Identity = {
  id: string;
  name: string;
  is_owner: boolean;
  connection_id: string | null;
  scope: string | null;
};
export type Revision = {
  document_id: string;
  revision: number;
  snapshot: WorkspaceDocument;
  created_at: string;
  author_id: string;
  connection_id: string | null;
};
export const emptyDocument = (): DocumentData =>
  documentSchema.parse({
    title: "Nový záznam",
    type: "documentation",
    content: "",
    validity: "unknown",
  });
