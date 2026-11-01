import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

test("Workspace: SQL transakcie, role, história, vyhľadávanie a OAuth", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);`);
    for (const name of ["schema", "auth", "rpc"])
      await db.exec(await readFile(`supabase/workspace-${name}.sql`, "utf8"));
    const q = async (sql, args = []) => (await db.query(sql, args)).rows;
    const owner = (
      await q(
        "insert into bendalabs_workspace.people(username,name,is_owner) values('marek','Marek',true) returning id",
      )
    )[0].id;
    const reader = (
      await q(
        "insert into bendalabs_workspace.people(username,name) values('reader','Čitateľ') returning id",
      )
    )[0].id;
    const outsider = (
      await q(
        "insert into bendalabs_workspace.people(username,name) values('other','Bez členstva') returning id",
      )
    )[0].id;
    const project = (
      await q(
        "insert into bendalabs_workspace.projects(slug,name) values('test-arm','Test ruka') returning id",
      )
    )[0].id;
    await q(
      "insert into bendalabs_workspace.members values($1,$2,'owner'),($1,$3,'reader')",
      [project, owner, reader],
    );
    await q(
      "insert into bendalabs_workspace.tokens(hash,person_id,kind,credential_version,expires_at) values ('owner',$1,'session','v1',now()+interval '1 hour'),('reader',$2,'session',null,now()+interval '1 hour'),('other',$3,'session',null,now()+interval '1 hour')",
      [owner, reader, outsider],
    );
    await db.exec("set role service_role");
    const rpc = async (op, p = {}, token = "owner") =>
      (
        await q(
          "select public.bendalabs_workspace_rpc($1,$2::jsonb,$3,$4,$5) result",
          [op, JSON.stringify(p), token, "v1", "https://test/workspace/mcp"],
        )
      )[0].result;
    assert.equal(
      (await rpc("list_projects", {}, "missing")).error,
      "unauthorized",
    );
    assert.deepEqual((await rpc("list_projects", {}, "other")).items, []);
    assert.equal(
      (await rpc("search_project", { project }, "other")).error,
      "not_found",
    );
    const data = {
      title: "Zapojenie HTS-25L",
      type: "hardware",
      content:
        "Mäkký pohyb ruky cez Serial1. ID6 pin 18. firmware.ino chyba TIMEOUT.",
      validity: "unknown",
      evidence: [],
      tags: ["motor"],
      links: [],
      sources: [],
    };
    const input = {
      project,
      data,
      expected_revision: 0,
      idempotency_key: "create-0001",
    };
    assert.equal(
      (await rpc("create_document", input, "reader")).error,
      "forbidden",
    );
    const created = await rpc("create_document", input);
    assert.equal(created.revision, 1, JSON.stringify(created));
    assert.equal((await rpc("create_document", input)).id, created.id);
    assert.equal(
      (
        await rpc("create_document", {
          ...input,
          data: { ...data, title: "iný" },
        })
      ).error,
      "idempotency_conflict",
    );
    for (const term of [
      "makky",
      "Mäkký",
      "HTS-25L",
      "Serial1",
      "ID6",
      "18",
      "firmware.ino",
      "TIMEOUT",
    ])
      assert.equal(
        (await rpc("search_project", { project, q: term })).items.length,
        1,
        term,
      );
    const change = {
      id: created.id,
      expected_revision: 1,
      idempotency_key: "update-0001",
      data: { ...data, content: "Nová revízia" },
    };
    assert.equal((await rpc("update_document", change)).revision, 2);
    assert.equal(
      (
        await rpc("update_document", {
          ...change,
          idempotency_key: "update-0002",
        })
      ).error,
      "conflict",
    );
    assert.equal(
      (await rpc("get_document_history", { id: created.id })).items.length,
      2,
    );
    assert.equal(
      (
        await rpc("restore_document", {
          id: created.id,
          revision: 1,
          expected_revision: 2,
          idempotency_key: "restore-001",
        })
      ).revision,
      3,
    );
    assert.equal(
      (await rpc("get_document", { id: created.id })).data.content,
      data.content,
    );
    assert.equal(
      (await rpc("get_document", { id: created.id }, "other")).error,
      "not_found",
    );
    const imported = await rpc("import_document", {
      ...input,
      source_key: "test-file",
      idempotency_key: "import-001",
    });
    assert.equal(
      (
        await rpc("import_document", {
          ...input,
          source_key: "test-file",
          idempotency_key: "import-002",
        })
      ).id,
      imported.id,
    );
    await rpc("register_client", {
      id: "test-client",
      name: "Test MCP",
      redirect_uris: ["http://127.0.0.1/callback"],
    });
    const grant = await rpc("authorize_client", {
      client_id: "test-client",
      redirect_uri: "http://127.0.0.1:1234/callback",
      project_ids: [project],
      scope: "workspace:read workspace:write",
      name: "Test klient",
      code_hash: "code",
      challenge: "challenge",
      resource: "https://test/workspace/mcp",
    });
    assert.ok(grant.connection_id);
    const exchange = {
      client_id: "test-client",
      redirect_uri: "http://127.0.0.1:1234/callback",
      code_hash: "code",
      challenge: "challenge",
      resource: "https://test/workspace/mcp",
      access_hash: "access",
      refresh_hash: "refresh",
    };
    assert.equal(
      (await rpc("exchange_code", { ...exchange, challenge: "wrong" })).error,
      "invalid_grant",
    );
    assert.equal(
      (await rpc("exchange_code", exchange)).connection_id,
      grant.connection_id,
    );
    assert.equal((await rpc("exchange_code", exchange)).error, "invalid_grant");
    assert.equal(
      (await rpc("get_document", { id: created.id }, "access")).revision,
      3,
    );
    const ai = await rpc(
      "update_document",
      { ...change, expected_revision: 3, idempotency_key: "ai-update-1" },
      "access",
    );
    assert.equal(ai.revision, 4);
    assert.equal(ai.connection_id, grant.connection_id);
    assert.equal(
      (await rpc("get_document", { id: created.id }, "reader")).revision,
      4,
    );
    await rpc("revoke_connection", { id: grant.connection_id });
    assert.equal(
      (await rpc("get_document", { id: created.id }, "access")).error,
      "unauthorized",
    );
    const task = await rpc("create_document", {
      ...input,
      data: { ...data, type: "task", title: "Test úloha", task_status: "open" },
      idempotency_key: "task-0001",
    });
    assert.equal(
      (
        await rpc("claim_task", {
          id: task.id,
          expected_revision: 1,
          idempotency_key: "claim-001",
        })
      ).revision,
      2,
    );
    const handed = await rpc("append_handoff", {
      id: task.id,
      expected_revision: 2,
      idempotency_key: "handoff-001",
      handoff: {
        changed: "Test",
        verified: "Simulácia",
        uncertain: "Hardvér",
        artifact: "commit:test",
        next: "Fyzický test",
      },
      task_status: "open",
    });
    assert.equal(handed.claim_until, null);
    assert.equal(handed.data.handoffs.length, 1);
    const exported = await rpc("export_project", { project });
    assert.ok(exported.revisions.length >= 8);
    assert.equal(exported.format, "bendalabs-workspace-v1");
    await db.exec("reset role");
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      await assert.rejects(
        q("select * from bendalabs_workspace.documents"),
        /permission denied/,
      );
      await assert.rejects(
        q("select public.bendalabs_workspace_rpc('list_projects')"),
        /permission denied/,
      );
      await db.exec("reset role");
    }
    const rls = await q(
      "select bool_and(relrowsecurity) enabled from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='bendalabs_workspace' and c.relkind='r'",
    );
    assert.equal(rls[0].enabled, true);
  } finally {
    await db.close();
  }
});
