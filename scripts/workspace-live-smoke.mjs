// Explicit remote acceptance test. Only writes to a newly generated, isolated test project.
import assert from "node:assert/strict";
import { randomUUID, randomBytes, createHash } from "node:crypto";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { verifyRestore } from "./workspace-restore.mjs";
const directory = join(tmpdir(), "bendalabs-workspace-live");
await mkdir(directory, { recursive: true });
const configFile = join(directory, "fixture.json");
if (process.argv[2] === "prepare") {
  const project = randomUUID(),
    a = randomBytes(32).toString("base64url"),
    b = randomBytes(32).toString("base64url"),
    ca = randomUUID(),
    cb = randomUUID();
  const cfg = {
    project,
    a,
    b,
    ca,
    cb,
    slug: `workspace-check-${project.slice(0, 8)}`,
  };
  await writeFile(configFile, JSON.stringify(cfg), { mode: 0o600 });
  const sha = (v) => createHash("sha256").update(v).digest("hex");
  await writeFile(
    join(directory, "seed.sql"),
    `begin; do $test$ declare person uuid; begin
 select id into person from bendalabs_workspace.people where username='marek' and is_owner;
 if person is null then raise exception 'Explicit owner missing';end if;
 insert into bendalabs_workspace.projects(id,slug,name) values('${project}','${cfg.slug}','Skúška pripojenia');
 insert into bendalabs_workspace.members values('${project}',person,'owner');
 insert into bendalabs_workspace.connections(id,person_id,name,project_ids,scope,client_id,resource) values
 ('${ca}',person,'Overenie nasadenia A',array['${project}'::uuid],'workspace:read workspace:write','smoke-a','https://bendalabs.sk/workspace/mcp'),
 ('${cb}',person,'Overenie nasadenia B',array['${project}'::uuid],'workspace:read','smoke-b','https://bendalabs.sk/workspace/mcp');
 insert into bendalabs_workspace.tokens(hash,person_id,connection_id,kind,expires_at) values
 ('${sha(a)}',person,'${ca}','access',now()+interval '30 minutes'),('${sha(b)}',person,'${cb}','access',now()+interval '30 minutes');
 end $test$;commit;`,
  );
  await writeFile(
    join(directory, "cleanup.sql"),
    `begin;update bendalabs_workspace.connections set revoked_at=now() where id in ('${ca}','${cb}');delete from bendalabs_workspace.tokens where connection_id in ('${ca}','${cb}');delete from bendalabs_workspace.members where project_id='${project}' and exists(select 1 from bendalabs_workspace.projects where id='${project}' and slug='${cfg.slug}');commit;`,
  );
  console.log(JSON.stringify({ prepared: true, directory, project }));
} else {
  const base = process.argv[2];
  if (!base?.startsWith("https://"))
    throw Error("Pass a verified HTTPS deployment URL.");
  if (process.argv.includes("--vercel")) {
    const originalFetch = globalThis.fetch,
      run = promisify(execFile);
    globalThis.fetch = async (input, init) => {
      const req = new Request(input, init),
        url = new URL(req.url);
      if (url.origin !== new URL(base).origin)
        return originalFetch(input, init);
      const prefix = join(directory, randomUUID()),
        files = ["headers", "body", "response", "meta"].map(
          (s) => `${prefix}.${s}`,
        );
      try {
        await writeFile(
          files[0],
          [...req.headers].map(([k, v]) => `${k}: ${v}`).join("\n"),
          { mode: 0o600 },
        );
        const args = [
          join(process.env.APPDATA, "npm/node_modules/vercel/dist/index.js"),
          "curl",
          url.pathname + url.search,
          "--deployment",
          base,
          "--scope",
          "mareks-projects-6d793694",
          "--",
          "--silent",
          "--max-time",
          "50",
          "--request",
          req.method,
          "--header",
          `@${files[0]}`,
          "--dump-header",
          files[3],
          "--output",
          files[2],
        ];
        if (req.body) {
          await writeFile(files[1], new Uint8Array(await req.arrayBuffer()), {
            mode: 0o600,
          });
          args.push("--data-binary", `@${files[1]}`);
        }
        await run(process.execPath, args, { maxBuffer: 1000000 });
        const block = (await readFile(files[3], "utf8"))
            .trim()
            .split(/\r?\n\r?\n/)
            .at(-1),
          lines = block.split(/\r?\n/),
          status = Number(lines.shift().split(" ")[1]),
          headers = new Headers();
        for (const line of lines) {
          const n = line.indexOf(":");
          if (n > 0) headers.append(line.slice(0, n), line.slice(n + 1).trim());
        }
        return new Response(
          [204, 205, 304].includes(status) ? null : await readFile(files[2]),
          { status, headers },
        );
      } finally {
        await Promise.all(files.map((path) => rm(path, { force: true })));
      }
    };
  }
  const cfg = JSON.parse(await readFile(configFile, "utf8"));
  const api = (op, p, token = cfg.a) =>
    fetch(`${base}/workspace/api/${op}`, {
      method: "POST",
      headers: {
        origin: "https://bendalabs.sk",
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(p),
    });
  const json = async (r) => {
    assert.equal(r.status, 200, `HTTP ${r.status}`);
    return r.json();
  };
  assert.equal((await api("list_projects", {}, null)).status, 401);
  const unauth = await fetch(base + "/workspace/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(unauth.status, 401);
  assert.match(unauth.headers.get("www-authenticate"), /resource_metadata/);
  const projects = await json(await api("list_projects", {}));
  assert.deepEqual(
    projects.items.map((p) => p.id),
    [cfg.project],
  );
  assert.equal(
    (await api("search_project", { project: "bendalabs-arm" })).status,
    404,
  );
  const clients = [];
  try {
    for (const [name, token] of [
      ["live-a", cfg.a],
      ["live-b", cfg.b],
    ]) {
      const c = new Client({ name, version: "1" });
      await c.connect(
        new StreamableHTTPClientTransport(new URL(base + "/workspace/mcp"), {
          requestInit: { headers: { authorization: `Bearer ${token}` } },
        }),
      );
      clients.push(c);
    }
    const call = async (c, name, args) => {
      const r = await c.callTool({ name, arguments: args });
      assert.ok(!r.isError, JSON.stringify(r));
      return JSON.parse(r.content[0].text);
    };
    await call(clients[0], "get_project_context", { project: cfg.slug });
    const p = {
      project: cfg.slug,
      data: {
        title: "Overenie HTS-25L",
        type: "test",
        content:
          "Mäkký pohyb HTS-25L Serial1 ID6 pin 18 — skúšobné údaje bez fyzického testu.",
        validity: "proposal",
      },
      expected_revision: 0,
      idempotency_key: "live-create-0001",
    };
    const created = await call(clients[0], "create_document", p);
    assert.equal(created.revision, 1);
    assert.equal((await call(clients[0], "create_document", p)).id, created.id);
    const doc = await call(clients[0], "get_document", { id: created.id });
    const update = await call(clients[0], "update_document", {
      id: doc.id,
      data: { ...doc.data, title: "Overená výmena revízie" },
      expected_revision: 1,
      idempotency_key: "live-update-0001",
    });
    assert.equal(
      (await call(clients[1], "get_document", { id: doc.id })).revision,
      2,
    );
    assert.equal(
      (
        await api(
          "update_document",
          {
            id: doc.id,
            data: doc.data,
            expected_revision: 2,
            idempotency_key: "live-reader-0001",
          },
          cfg.b,
        )
      ).status,
      403,
    );
    const conflict = await Promise.all(
      ["a", "b"].map((s) =>
        api("update_document", {
          id: doc.id,
          data: { ...update.data, content: `${doc.data.content}\n${s}` },
          expected_revision: 2,
          idempotency_key: `live-parallel-${s}`,
        }),
      ),
    );
    assert.deepEqual(conflict.map((r) => r.status).sort(), [200, 409]);
    for (const q of ["makky", "HTS-25L", "Serial1", "ID6"])
      assert.equal(
        (await json(await api("search_project", { project: cfg.slug, q })))
          .items.length,
        1,
      );
    const form = new FormData();
    form.set("project", cfg.slug);
    form.set("document_id", doc.id);
    form.set(
      "file",
      new Blob(["Súkromná skúšobná príloha"], { type: "text/plain" }),
      "overenie.txt",
    );
    const attachment = await json(
      await fetch(base + "/workspace/attachments", {
        method: "POST",
        headers: { authorization: `Bearer ${cfg.a}` },
        body: form,
      }),
    );
    assert.equal(
      (
        await fetch(
          `${base}/workspace/attachments?project=${cfg.slug}&id=${attachment.id}`,
        )
      ).status,
      401,
    );
    assert.ok(
      !(
        await fetch(
          `https://figgfdxmlaawoqsgidyx.supabase.co/storage/v1/object/public/bendalabs-workspace/${cfg.project}/${attachment.id}`,
        )
      ).ok,
    );
    const archive = await fetch(
      `${base}/workspace/export?project=${cfg.slug}`,
      { headers: { authorization: `Bearer ${cfg.a}` } },
    );
    assert.equal(archive.status, 200);
    assert.equal(
      (await verifyRestore(new Uint8Array(await archive.arrayBuffer())))
        .attachments,
      1,
    );
    await call(clients[0], "archive_document", {
      id: doc.id,
      expected_revision: 3,
      idempotency_key: "live-archive-0001",
    });
    for (const [client_id, token] of [
      ["smoke-a", cfg.a],
      ["smoke-b", cfg.b],
    ])
      assert.equal(
        (
          await fetch(base + "/workspace/oauth/revoke", {
            method: "POST",
            body: new URLSearchParams({ client_id, token }),
          })
        ).status,
        200,
      );
    assert.equal((await api("get_document", { id: doc.id })).status, 401);
    const result = {
      passed: true,
      base,
      project: cfg.project,
      document: doc.id,
      revision: 4,
      checks: [
        "remote Next → Edge → Supabase",
        "project scope",
        "MCP A context → document → write → MCP B revision",
        "read scope",
        "idempotency",
        "concurrency conflict",
        "Slovak and technical search",
        "private actual Storage object",
        "ZIP restore with actual attachment",
        "revocation",
      ],
      providerClients: "zatiaľ neoverené",
    };
    await writeFile(
      join(directory, "result.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  } finally {
    for (const c of clients) await c.close();
  }
}
