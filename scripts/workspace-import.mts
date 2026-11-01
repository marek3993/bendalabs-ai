import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { documentSchema, type DocumentData } from "../src/lib/workspace/types";
const root = process.argv[2] || "C:/Projects/BendaLabsArm";
const output = resolve(process.argv[3] || "private-workspace/import");
const canonical = join(root, "docs/BENDALABS_ARM_SOURCE_OF_TRUTH.md");
const sha = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
const candidates: string[] = [];
async function walk(path: string) {
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (
        !["node_modules", ".git", "runtime", "pi_display"].includes(entry.name)
      )
        await walk(join(path, entry.name));
    } else if (/^BENDALABS_ARM_SOURCE_OF_TRUTH.*\.md$/i.test(entry.name))
      candidates.push(join(path, entry.name));
  }
}
await walk(root);
const versions = await Promise.all(
  candidates.map(async (path) => {
    const bytes = await readFile(path),
      content = bytes.toString("utf8");
    return {
      path,
      sha256: sha(bytes),
      revision: content.match(/\*\*Revízia:\*\*\s*([\d.]+)/)?.[1] || "neznáma",
      content,
    };
  }),
);
const found = versions.find((v) => resolve(v.path) === resolve(canonical));
if (!found) throw Error(`Chýba ${canonical}`);
const current = found;
const newer = versions.filter(
  (v) =>
    v.revision !== "neznáma" && Number(v.revision) > Number(current.revision),
);
if (newer.length)
  throw Error(
    "Existuje novšia verzia než kanonický súbor; import bol zastavený.",
  );
const conflicting = versions.filter(
  (v) => v.revision === current.revision && v.sha256 !== current.sha256,
);
if (conflicting.length && process.argv[4] !== current.sha256)
  throw Error("Rovnaká revízia má rozdielny obsah; import bol zastavený.");
const observed =
  current.content.match(/\*\*Aktualizované:\*\*\s*([^\n]+)/)?.[1]?.trim() ||
  "Dátum v pôvodnom dokumente";
const source = {
  uri: canonical,
  label: `Zdroj pravdy ruky, revízia ${current.revision}`,
  hash: current.sha256,
  observed_at: observed,
};
const records: Array<{ source_key: string; data: DocumentData }> = [];
function record(
  source_key: string,
  title: string,
  type: DocumentData["type"],
  content: string,
  invalid = false,
  src = source,
) {
  const existing = records.find((r) => r.source_key === source_key);
  if (existing) {
    if (existing.data.content !== content)
      throw Error("Kolízia zdrojového identifikátora.");
    if (!existing.data.sources.some((s) => s.uri === src.uri))
      existing.data.sources.push(src);
    return;
  }
  const claims = content
    .split(/\n\s*\n|\n(?=- )/)
    .filter((x) => /\*\*(USER|HW|CODE|REPORT|PLAN|UNKNOWN|TEST|BUILD)/.test(x))
    .slice(0, 200)
    .map((text) => {
      const marker = text.match(/\*\*([A-Z]+(?:\/[A-Z]+)*)/)?.[1] || "REPORT";
      const evidence: DocumentData["evidence"] = [];
      if (marker.includes("TEST")) evidence.push("simulation");
      if (marker.includes("USER")) evidence.push("user");
      if (marker.includes("CODE")) evidence.push("code");
      if (marker.includes("HW") || marker.includes("REPORT"))
        evidence.push("agent");
      return {
        text: text.slice(0, 10000),
        validity: invalid
          ? ("invalid" as const)
          : marker.includes("PLAN")
            ? ("proposal" as const)
            : marker.includes("UNKNOWN") ||
                marker.includes("REPORT") ||
                /nepotvrd|neover|UNKNOWN|čaká|odhad/i.test(text)
              ? ("unknown" as const)
              : ("verified" as const),
        evidence,
        source_marker: marker,
        observed_at: src.observed_at,
      };
    });
  records.push({
    source_key,
    data: documentSchema.parse({
      title,
      type,
      content,
      validity: invalid ? "invalid" : "unknown",
      evidence: ["agent"],
      evidence_note: `Import časovej snímky: ${src.label}, ${src.observed_at}. Pôvodné označenia a jednotlivé tvrdenia sú zachované. Import nepredstavuje nové meranie ani nové fyzické overenie. HW sa prenáša ako citovaný report; fyzický test sa z tejto skratky neodvodzuje.`,
      tags: ["import", `zdroj-${src.hash?.slice(0, 12)}`],
      sources: [src],
      claims,
    }),
  });
}
record(
  "arm:canonical",
  "Robotická ruka — pôvodný zdroj pravdy",
  "documentation",
  current.content,
);
const sectionCounts = new Map<string, number>();
for (const section of current.content
  .split(/(?=^## )/m)
  .filter((x) => x.startsWith("## "))) {
  const title = section.split("\n")[0].replace(/^## /, ""),
    number = title.match(/^\d+/)?.[0] || sha(title).slice(0, 8);
  const type: DocumentData["type"] =
    number === "0"
      ? "overview"
      : number === "1"
        ? "rules"
        : /hardvér|zapojenie/i.test(title)
          ? "hardware"
          : /konfigur|mapovan|verzi/i.test(title)
            ? "configuration"
            : /test|overeni/i.test(title)
              ? "test"
              : /neznám|otvoren|problém/i.test(title)
                ? "problem"
                : /YouTube/i.test(title)
                  ? "journal"
                  : "documentation";
  const index = (sectionCounts.get(number) || 0) + 1;
  sectionCounts.set(number, index);
  record(`arm:section:${number}:${index}`, title, type, section);
}
for (const old of versions.filter((v) =>
  resolve(v.path).includes(`${resolve(root)}\\docs\\archive\\`),
)) {
  record(
    `arm:archive:${old.revision}:${old.sha256.slice(0, 12)}`,
    `Historický zdroj pravdy — ${old.revision}`,
    "documentation",
    old.content,
    true,
    {
      uri: old.path,
      label: `Historická revízia ${old.revision}`,
      hash: old.sha256,
      observed_at:
        old.content.match(/\*\*Aktualizované:\*\*\s*([^\n]+)/)?.[1]?.trim() ||
        "Historický dokument; dátum nie je uvedený",
    },
  );
}
const journal = join(root, "docs/YOUTUBE_DENNiK.md");
try {
  const bytes = await readFile(journal);
  record(
    "arm:youtube",
    "YouTube denník — pôvodná chronológia",
    "journal",
    bytes.toString("utf8"),
    false,
    {
      uri: journal,
      label: "Pôvodný YouTube denník",
      hash: sha(bytes),
      observed_at: "Pôvodná chronológia; dátumy sú pri jednotlivých zápisoch",
    },
  );
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
await mkdir(output, { recursive: true });
await writeFile(
  join(output, "review.json"),
  JSON.stringify(
    {
      selected: {
        path: canonical,
        revision: current.revision,
        sha256: current.sha256,
      },
      sameRevisionConflictReviewed: conflicting.length > 0,
      acceptedCanonicalHash: conflicting.length ? process.argv[4] : null,
      versions: versions.map(({ content, ...v }) => ({
        ...v,
        lines: content.split("\n").length,
      })),
      records: records.map((r) => ({
        key: r.source_key,
        title: r.data.title,
        type: r.data.type,
        validity: r.data.validity,
        claims: r.data.claims.length,
      })),
      note: "Pôvodné dokumenty sú nezmenené; ide o časové snímky.",
    },
    null,
    2,
  ),
);
await writeFile(join(output, "records.json"), JSON.stringify(records, null, 2));
for (let i = 0; i < records.length; i++) {
  const r = records[i],
    literal = JSON.stringify(r).replace(/'/g, "''");
  const delimiter = `$import_${sha(literal).slice(0, 16)}$`;
  const sql = `begin; do ${delimiter} declare p jsonb := '${literal}'::jsonb; person uuid; project uuid; conn uuid; result jsonb; rev int; replacement uuid; token text:=md5(gen_random_uuid()::text); begin
 select id into person from bendalabs_workspace.people where username='marek' and is_owner;
 select id into project from bendalabs_workspace.projects where slug='bendalabs-arm';
 insert into bendalabs_workspace.connections(person_id,name,project_ids,scope,resource) values(person,'Codex — import zdrojového dokumentu',array[project],'workspace:read workspace:write','urn:bendalabs:import') returning id into conn;
 insert into bendalabs_workspace.tokens(hash,person_id,connection_id,kind,expires_at) values(token,person,conn,'access',now()+interval '5 minutes');
 select revision into rev from bendalabs_workspace.documents where project_id=project and source_key=p->>'source_key';
 if p->>'source_key' like 'arm:archive:%' then
 select id into replacement from bendalabs_workspace.documents where project_id=project and source_key='arm:canonical';
 p:=jsonb_set(p,'{data}',p->'data'||jsonb_build_object('replaced_by',replacement,'links',jsonb_build_array(replacement)));
 end if;
 result:=public.bendalabs_workspace_rpc('import_document',p||jsonb_build_object('project','bendalabs-arm','expected_revision',coalesce(rev,0),'idempotency_key','import:'||md5((p->>'source_key')||(p->'data')::text)),token,null,'urn:bendalabs:import');
 if result ? 'error' then raise exception 'Import failed: %',result->>'error'; end if;
 delete from bendalabs_workspace.tokens where hash=token;update bendalabs_workspace.connections set revoked_at=now() where id=conn;
 end ${delimiter}; commit;`;
  await writeFile(join(output, `${String(i + 1).padStart(3, "0")}.sql`), sql);
}
console.log(
  JSON.stringify({
    revision: current.revision,
    sha256: current.sha256,
    copiesCompared: versions.length,
    records: records.length,
    output,
  }),
);
