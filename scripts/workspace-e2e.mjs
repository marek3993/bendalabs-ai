// Fully isolated Next → real Edge handler → Postgres (PGlite). No production credentials.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync, openSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { chromium } from "playwright";
const base = "http://localhost:3123",
  bridge = "http://127.0.0.1:4123";
const key = "isolated-workspace-bridge-key-for-tests",
  password = "isolated-owner-test-password";
const digest = (x) => createHash("sha256").update(x).digest("hex");
const output = join(tmpdir(), "bendalabs-workspace-e2e");
await mkdir(output, { recursive: true });
const db = new PGlite();
let app, browser;
const storage = new Map();
globalThis.Deno = {
  env: {
    get: (name) =>
      ({
        SUPABASE_URL: bridge,
        SUPABASE_SERVICE_ROLE_KEY: "isolated-service-key",
        BENDALABS_WORKSPACE_KEY_SHA256: digest(key),
      })[name],
  },
  serve: () => {},
};
const { handler } =
  await import("../supabase/functions/bendalabs-workspace/index.ts");
const query = async (sql, args = []) => (await db.query(sql, args)).rows;
const server = createServer(async (req, res) => {
  try {
    if (req.url.startsWith("/callback?"))
      return res.end("Pripojenie dokončené.");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const bytes = Buffer.concat(chunks);
    if (req.url === "/functions/v1/bendalabs-workspace") {
      const response = await handler(
        new Request(bridge + req.url, {
          method: req.method,
          headers: req.headers,
          body: bytes,
        }),
      );
      res.writeHead(response.status, Object.fromEntries(response.headers));
      return res.end(Buffer.from(await response.arrayBuffer()));
    }
    if (req.headers.authorization !== "Bearer isolated-service-key") {
      res.writeHead(401);
      return res.end("{}");
    }
    if (req.url === "/rest/v1/rpc/bendalabs_workspace_rpc") {
      const p = JSON.parse(bytes);
      const result = (
        await query(
          "select public.bendalabs_workspace_rpc($1,$2::jsonb,$3,$4,$5) result",
          [
            p.p_operation,
            JSON.stringify(p.p_payload),
            p.p_token_hash,
            p.p_credential_version,
            p.p_resource,
          ],
        )
      )[0].result;
      res.setHeader("content-type", "application/json");
      return res.end(JSON.stringify(result));
    }
    if (req.url.startsWith("/storage/v1/object")) {
      const path = req.url.replace("/authenticated/", "/");
      if (req.method === "POST") {
        storage.set(path, bytes);
        return res.end("{}");
      }
      if (req.method === "DELETE") {
        storage.delete(path);
        return res.end("{}");
      }
      if (!storage.has(path)) {
        res.writeHead(404);
        return res.end("{}");
      }
      return res.end(storage.get(path));
    }
    res.writeHead(404);
    res.end("{}");
  } catch (error) {
    console.error("Isolated bridge:", error.message);
    res.writeHead(500);
    res.end("{}");
  }
});
const api = async (op, data, cookie, auth) =>
  fetch(`${base}/workspace/api/${op}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
      ...(cookie ? { cookie } : {}),
      ...(auth ? { authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(data),
  });
async function oauth(
  cookie,
  name,
  project,
  scope = "workspace:read workspace:write",
  browserPage,
) {
  const registered = await (
    await fetch(`${base}/workspace/oauth/register`, {
      method: "POST",
      body: JSON.stringify({
        client_name: name,
        redirect_uris: ["http://127.0.0.1/callback"],
        token_endpoint_auth_method: "none",
      }),
      headers: { "content-type": "application/json" },
    })
  ).json();
  assert.ok(registered.client_id, JSON.stringify(registered));
  const verifier = randomBytes(32).toString("base64url"),
    challenge = createHash("sha256").update(verifier).digest("base64url");
  const params = {
    client_id: registered.client_id,
    redirect_uri: "http://127.0.0.1:4123/callback",
    response_type: "code",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: `${base}/workspace/mcp`,
    state: "test-state",
    scope,
  };
  const page = await fetch(
    `${base}/workspace/oauth/authorize?${new URLSearchParams(params)}`,
    { headers: { cookie } },
  );
  assert.equal(page.status, 200);
  let callback;
  if (browserPage) {
    await browserPage.route("http://127.0.0.1:4123/callback**", (route) =>
      route.fulfill({ status: 200, body: "Pripojenie dokončené." }),
    );
    await browserPage.goto(
      `${base}/workspace/oauth/authorize?${new URLSearchParams(params)}`,
    );
    await browserPage.getByLabel("Názov pripojenia").fill(name);
    await browserPage
      .locator(`input[name="projects"][value="${project}"]`)
      .check();
    await Promise.all([
      browserPage.waitForURL("http://127.0.0.1:4123/callback**"),
      browserPage
        .getByRole("button", { name: "Povoliť pripojenie", exact: true })
        .click(),
    ]);
    callback = browserPage.url();
  } else {
    const consent = await fetch(`${base}/workspace/oauth/consent`, {
      method: "POST",
      headers: {
        cookie,
        origin: base,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ ...params, name, projects: project }),
      redirect: "manual",
    });
    assert.equal(consent.status, 303, await consent.text());
    callback = consent.headers.get("location");
  }
  const code = new URL(callback).searchParams.get("code");
  const response = await fetch(`${base}/workspace/oauth/token`, {
    method: "POST",
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: registered.client_id,
      redirect_uri: params.redirect_uri,
      code,
      code_verifier: verifier,
      resource: params.resource,
    }),
  });
  assert.equal(response.status, 200);
  const tokens = await response.json();
  assert.ok(tokens.access_token);
  return tokens;
}
try {
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);`,
  );
  for (const name of ["schema", "auth", "rpc"])
    await db.exec(await readFile(`supabase/workspace-${name}.sql`, "utf8"));
  const owner = (
    await query(
      "insert into bendalabs_workspace.people(username,name,is_owner) values('marek','Marek – test',true) returning id",
    )
  )[0].id;
  const project = (
    await query(
      "insert into bendalabs_workspace.projects(slug,name) values('test-arm','Robotická ruka — skúšobný projekt') returning id",
    )
  )[0].id;
  await query("insert into bendalabs_workspace.members values($1,$2,'owner')", [
    project,
    owner,
  ]);
  await db.exec("set role service_role");
  await new Promise((r) => server.listen(4123, "127.0.0.1", r));
  const env = Object.fromEntries(
    [
      "PATH",
      "Path",
      "PATHEXT",
      "SystemRoot",
      "SYSTEMROOT",
      "ComSpec",
      "TEMP",
      "TMP",
      "USERPROFILE",
      "APPDATA",
      "LOCALAPPDATA",
    ]
      .filter((k) => process.env[k])
      .map((k) => [k, process.env[k]]),
  );
  Object.assign(env, {
    NODE_ENV: "test",
    WORKSPACE_ORIGIN: base,
    WORKSPACE_STORAGE_URL: `${bridge}/functions/v1/bendalabs-workspace`,
    BENDALABS_LEADS_KEY: key,
    ADMIN_LEADS_PASSWORD: password,
    NEXT_TELEMETRY_DISABLED: "1",
  });
  const log = openSync(join(output, "server.log"), "w");
  app = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3123",
    ],
    { env, stdio: ["ignore", log, log] },
  );
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/workspace")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.ok(ready, "Next server ready");
  assert.equal((await api("list_projects", {})).status, 401);
  const anonymous = await fetch(base + "/workspace");
  const html = await anonymous.text();
  assert.ok(!html.includes("skúšobný projekt"));
  assert.ok(!html.includes("googletagmanager"));
  assert.ok(anonymous.headers.get("cache-control").includes("no-store"));
  const denied = await fetch(base + "/workspace/mcp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(denied.status, 401);
  assert.ok(
    denied.headers.get("www-authenticate").includes("oauth-protected-resource"),
  );
  const login = await fetch(base + "/workspace/login", {
    method: "POST",
    headers: {
      origin: base,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ username: "marek", password }),
    redirect: "manual",
  });
  assert.equal(login.status, 303);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "login creates session");
  const data = {
    title: "Plynulý pohyb HTS-25L",
    type: "hardware",
    content:
      "Mäkký pohyb HTS-25L cez Serial1. ID6 pin 18.\n\n| Pin | Signál |\n|---|---|\n| 18 | TX |\n\n```cpp\nSerial1.begin(115200);\n```\n\n<script>alert(1)</script>\n[Útok](javascript:alert(1))",
    validity: "verified",
    evidence: ["simulation"],
    evidence_note: "Izolovaná softvérová simulácia, bez fyzického testu.",
  };
  const created = await (
    await api(
      "create_document",
      {
        project: "test-arm",
        data,
        expected_revision: 0,
        idempotency_key: "e2e-create-0001",
      },
      cookie,
    )
  ).json();
  assert.equal(created.revision, 1, JSON.stringify(created));
  const changes = await Promise.all(
    ["A", "B"].map((suffix) =>
      api(
        "update_document",
        {
          id: created.id,
          data: { ...data, title: `Súbežná zmena ${suffix}` },
          expected_revision: 1,
          idempotency_key: `parallel-${suffix}`,
        },
        cookie,
      ),
    ),
  );
  assert.deepEqual(changes.map((r) => r.status).sort(), [200, 409]);
  for (const q of ["makky", "HTS-25L", "Serial1", "ID6"]) {
    const found = await (
      await api("search_project", { project: "test-arm", q }, cookie)
    ).json();
    assert.equal(found.items.length, 1, q);
  }
  const a = await oauth(cookie, "Testovací MCP klient A", project),
    b = await oauth(
      cookie,
      "Testovací MCP klient B",
      project,
      "workspace:read",
    );
  const connect = async (name, access) => {
    const client = new Client({ name, version: "1.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(new URL(base + "/workspace/mcp"), {
        requestInit: { headers: { authorization: `Bearer ${access}` } },
      }),
    );
    return client;
  };
  const first = await connect("independent-client-a", a.access_token),
    second = await connect("independent-client-b", b.access_token);
  const call = async (client, name, args) => {
    const r = await client.callTool({ name, arguments: args });
    assert.ok(!r.isError, JSON.stringify(r));
    return JSON.parse(r.content[0].text);
  };
  assert.equal((await call(first, "list_projects", {})).items.length, 1);
  assert.ok(
    (await call(first, "get_project_context", { project: "test-arm" })).items
      .length,
  );
  const before = await call(first, "get_document", { id: created.id });
  const updated = await call(first, "update_document", {
    id: created.id,
    data: { ...before.data, title: "Zmena od MCP klienta A" },
    expected_revision: before.revision,
    idempotency_key: "mcp-write-0001",
  });
  assert.equal(
    (await call(second, "get_document", { id: created.id })).revision,
    updated.revision,
  );
  const forbidden = await second.callTool({
    name: "update_document",
    arguments: {
      id: created.id,
      data: before.data,
      expected_revision: updated.revision,
      idempotency_key: "forbidden-001",
    },
  });
  assert.ok(forbidden.isError);
  const form = new FormData();
  form.set("project", "test-arm");
  form.set("document_id", created.id);
  form.set(
    "file",
    new Blob(["private test attachment"], { type: "text/plain" }),
    "meranie.txt",
  );
  const uploaded = await (
    await fetch(base + "/workspace/attachments", {
      method: "POST",
      headers: { cookie, origin: base },
      body: form,
    })
  ).json();
  assert.ok(uploaded.id, JSON.stringify(uploaded));
  assert.equal(
    (
      await fetch(
        `${base}/workspace/attachments?project=test-arm&id=${uploaded.id}`,
      )
    ).status,
    401,
  );
  assert.equal(
    await (
      await fetch(
        `${base}/workspace/attachments?project=test-arm&id=${uploaded.id}`,
        { headers: { cookie } },
      )
    ).text(),
    "private test attachment",
  );
  const archive = await fetch(base + "/workspace/export?project=test-arm", {
    headers: { cookie },
  });
  assert.equal(archive.status, 200);
  const { unzipSync } = await import("fflate");
  const archiveBytes = new Uint8Array(await archive.arrayBuffer());
  const files = unzipSync(archiveBytes);
  const { verifyRestore } = await import("./workspace-restore.mjs");
  assert.equal((await verifyRestore(archiveBytes)).restored, true);
  assert.ok(files["project.json"]);
  assert.ok(files[`attachments/${uploaded.id}`]);
  const all = (await (await api("list_connections", {}, cookie)).json()).items;
  await api(
    "revoke_connection",
    { id: all.find((x) => x.name === "Testovací MCP klient A").id },
    cookie,
  );
  assert.equal(
    (await api("get_document", { id: created.id }, null, a.access_token))
      .status,
    401,
  );
  await first.close();
  await second.close();
  const executable = [
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  ].find(existsSync);
  browser = await chromium.launch({
    headless: true,
    ...(executable ? { executablePath: executable } : {}),
  });
  const browserErrors = [];
  for (const width of [1440, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => browserErrors.push(e.message));
    await page.goto(base + "/workspace");
    await page.getByLabel("Heslo", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Prihlásiť sa", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Robotická ruka — skúšobný projekt" })
      .waitFor();
    await page.getByRole("button", { name: "Záznamy", exact: true }).click();
    await page
      .getByRole("button", {
        name: width === 1440 ? "Zmena od MCP klienta A" : "Overenie editora",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Zobraziť náhľad", exact: true })
      .click();
    await page.locator(".ws-markdown table").waitFor();
    assert.equal(await page.locator(".ws-markdown script").count(), 0);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: join(output, `workspace-${width}.png`),
      fullPage: true,
    });
    if (width === 1440) {
      await page
        .getByRole("button", { name: "Upraviť Markdown", exact: true })
        .click();
      await page.getByLabel("Tagy a komponenty").fill("HTS-25L, Serial1");
      await page.getByLabel("Názov", { exact: true }).fill("Overenie editora");
      await page
        .getByRole("button", { name: "Uložiť revíziu", exact: true })
        .click();
      await page
        .getByText(`Revízia ${updated.revision + 1} ·`, { exact: false })
        .waitFor();
      const saved = await (
        await api("get_document", { id: created.id }, cookie)
      ).json();
      assert.deepEqual(saved.data.tags, ["HTS-25L", "Serial1"]);
      await page.getByRole("button", { name: "← Späť", exact: true }).click();
      await page
        .getByRole("button", { name: "Pridať do obľúbených" })
        .first()
        .click();
      await page.getByText("Filtre a uložené pohľady", { exact: true }).click();
      page.once("dialog", (dialog) => dialog.accept("Môj filter"));
      await page
        .getByRole("button", { name: "Uložiť filter", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Môj filter", exact: true })
        .waitFor();
      const browserGrant = await oauth(
        cookie,
        "Prehliadač — skúška",
        project,
        "workspace:write workspace:read",
        page,
      );
      assert.ok(browserGrant.access_token);
    }
    await context.close();
  }
  assert.deepEqual(browserErrors, []);
  await browser.close();
  browser = null;
  const out = await fetch(base + "/workspace/logout", {
    method: "POST",
    headers: { cookie, origin: base },
    redirect: "manual",
  });
  assert.equal(out.status, 303);
  assert.equal((await api("list_projects", {}, cookie)).status, 401);
  const summary = {
    passed: true,
    checks: [
      "anonymous isolation",
      "OAuth PKCE",
      "two independent SDK MCP clients: context → document → write → revision read",
      "reader write denied",
      "revocation",
      "concurrent revision conflict",
      "search",
      "private attachment",
      "export with binaries",
      "native browser login",
      "safe Markdown",
      "desktop and mobile",
      "logout",
    ],
    clientCompatibility: {
      ChatGPT: "zatiaľ neoverené",
      Claude: "zatiaľ neoverené",
      Codex: "zatiaľ neoverené",
    },
    screenshots: output,
  };
  await writeFile(
    join(output, "result.json"),
    JSON.stringify(summary, null, 2),
  );
  console.log(JSON.stringify(summary, null, 2));
} finally {
  if (browser) await browser.close();
  if (app) app.kill();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
  await db.close();
}
