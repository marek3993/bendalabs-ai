import { unzipSync, strFromU8 } from "fflate";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import assert from "node:assert/strict";

// Restores the complete portable export into a fresh isolated Postgres database.
// Deliberately does not restore credentials or grant access to exported identities.
export async function verifyRestore(bytes) {
  const files = unzipSync(new Uint8Array(bytes));
  if (!files["project.json"]) throw Error("Chýba project.json");
  const data = JSON.parse(strFromU8(files["project.json"]));
  if (data.format !== "bendalabs-workspace-v1")
    throw Error("Nepodporovaný formát");
  const db = new PGlite();
  try {
    await db.exec(
      `create table documents(id uuid primary key,project_id uuid not null,revision int not null,data jsonb not null);create table revisions(document_id uuid references documents,revision int,snapshot jsonb,primary key(document_id,revision));create table audit(id bigint primary key,entry jsonb);create table attachments(id uuid primary key,bytes bytea,manifest jsonb);`,
    );
    await db.transaction(async (tx) => {
      for (const d of data.documents) {
        assert.equal(d.project_id, data.project.id);
        await tx.query("insert into documents values($1,$2,$3,$4)", [
          d.id,
          d.project_id,
          d.revision,
          d.data,
        ]);
      }
      for (const r of data.revisions)
        await tx.query("insert into revisions values($1,$2,$3)", [
          r.document_id,
          r.revision,
          r.snapshot,
        ]);
      for (const a of data.audit)
        await tx.query("insert into audit values($1,$2)", [a.id, a]);
      for (const a of data.attachments) {
        const file = files[`attachments/${a.id}`];
        if (!file) throw Error(`Chýba príloha ${a.id}`);
        assert.equal(file.length, a.bytes);
        assert.equal(createHash("sha256").update(file).digest("hex"), a.sha256);
        await tx.query("insert into attachments values($1,$2,$3)", [
          a.id,
          file,
          a,
        ]);
      }
    });
    for (const d of data.documents) {
      const row = (
        await db.query("select * from documents where id=$1", [d.id])
      ).rows[0];
      assert.deepEqual(row.data, d.data);
      const latest = (
        await db.query(
          "select * from revisions where document_id=$1 order by revision desc limit 1",
          [d.id],
        )
      ).rows[0];
      assert.equal(latest.revision, d.revision);
      assert.deepEqual(latest.snapshot.data, d.data);
    }
    return {
      documents: data.documents.length,
      revisions: data.revisions.length,
      audit: data.audit.length,
      attachments: data.attachments.length,
      restored: true,
      externalReferences: [
        ...new Set(
          data.documents
            .flatMap((d) => d.data.links || [])
            .filter((id) => !data.documents.some((d) => d.id === id)),
        ),
      ],
    };
  } finally {
    await db.close();
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (!process.argv[2])
    throw Error("Použitie: node scripts/workspace-restore.mjs projekt.zip");
  console.log(
    JSON.stringify(await verifyRestore(await readFile(process.argv[2]))),
  );
}
