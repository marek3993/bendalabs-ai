"use client";
import { useState } from "react";
import {
  EVIDENCE,
  TASK_STATUS,
  TYPES,
  VALIDITY,
  type DocumentData,
  type Revision,
  type WorkspaceDocument,
} from "@/lib/workspace/types";
import { api, date, message } from "./client";
import { Markdown } from "./markdown";

export function Editor({
  document,
  project,
  canWrite,
  onSaved,
  onClose,
}: {
  document: WorkspaceDocument;
  project: string;
  canWrite: boolean;
  onSaved: (d: WorkspaceDocument) => void;
  onClose: () => void;
}) {
  const [data, setData] = useState<DocumentData>(document.data),
    [preview, setPreview] = useState(!canWrite),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [history, setHistory] = useState<Revision[]>([]),
    [compare, setCompare] = useState<Revision | null>(null),
    [copied, setCopied] = useState(false);
  const [handoff, setHandoff] = useState({
    changed: "",
    verified: "",
    uncertain: "",
    artifact: "",
    next: "",
  });
  const [showHandoff, setShowHandoff] = useState(false);
  const [loadedAt] = useState(() => Date.now());
  const change = <K extends keyof DocumentData>(
    key: K,
    value: DocumentData[K],
  ) => setData((old) => ({ ...old, [key]: value }));
  async function save(
    operation = "update_document",
    extra: Record<string, unknown> = {},
  ) {
    setBusy(true);
    setError("");
    try {
      const d = await api<WorkspaceDocument>(
        document.id ? operation : "create_document",
        {
          ...(document.id ? { id: document.id } : { project }),
          ...(["update_document", "create_document", "update_task"].includes(
            operation,
          )
            ? { data }
            : {}),
          expected_revision: document.revision,
          idempotency_key: crypto.randomUUID(),
          ...extra,
        },
      );
      onSaved(d);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function loadHistory() {
    try {
      setHistory(
        (
          await api<{ items: Revision[] }>("get_document_history", {
            id: document.id,
          })
        ).items,
      );
    } catch (e) {
      setError(message(e));
    }
  }
  async function upload(file: File) {
    setBusy(true);
    try {
      const form = new FormData();
      form.set("project", project);
      form.set("document_id", document.id);
      form.set("file", file);
      const response = await fetch("/workspace/attachments", {
        method: "POST",
        body: form,
      });
      const result = await response.json();
      if (!response.ok)
        throw Error(result.message || "Prílohu sa nepodarilo uložiť.");
      const url = `/workspace/attachments?project=${encodeURIComponent(project)}&id=${result.id}`;
      change(
        "content",
        data.content +
          `\n\n${file.type.startsWith("image/") ? "!" : ""}[${file.name.replace(/[\[\]]/g, "")}](${url})`,
      );
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  const dirty = JSON.stringify(data) !== JSON.stringify(document.data);
  const rows = compare
    ? diffLines(compare.snapshot.data.content, data.content)
    : [];
  return (
    <section className="ws-editor">
      <div className="ws-row">
        <button
          className="secondary"
          onClick={() => {
            if (!dirty || confirm("Zahodiť neuložené zmeny?")) onClose();
          }}
        >
          ← Späť
        </button>
        <span className="ws-muted">
          {document.id
            ? `Revízia ${document.revision} · ${date(document.updated_at)}`
            : "Nový záznam"}
        </span>
        <div className="ws-spacer" />
        {document.id && (
          <button
            className="secondary"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${location.origin}/workspace?project=${project}&document=${document.id}`,
              );
              setCopied(true);
            }}
          >
            {copied ? "Odkaz skopírovaný" : "Kopírovať odkaz"}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="ws-alert">
          {error}
        </p>
      )}
      <label>
        Názov
        <input
          value={data.title}
          disabled={!canWrite}
          onChange={(e) => change("title", e.target.value)}
        />
      </label>
      <div className="ws-grid3">
        <label>
          Typ
          <select
            value={data.type}
            disabled={!canWrite}
            onChange={(e) =>
              change("type", e.target.value as DocumentData["type"])
            }
          >
            {Object.entries(TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Platnosť
          <select
            value={data.validity}
            disabled={!canWrite}
            onChange={(e) =>
              change("validity", e.target.value as DocumentData["validity"])
            }
          >
            {Object.entries(VALIDITY).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tagy a komponenty
          <input
            defaultValue={data.tags.join(", ")}
            disabled={!canWrite}
            onBlur={(e) =>
              change(
                "tags",
                e.target.value
                  .split(",")
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
      </div>
      <fieldset>
        <legend>Dôkazy</legend>
        <div className="ws-row">
          {Object.entries(EVIDENCE).map(([key, value]) => (
            <label className="ws-check" key={key}>
              <input
                type="checkbox"
                disabled={!canWrite}
                checked={data.evidence.includes(key as keyof typeof EVIDENCE)}
                onChange={(e) =>
                  change(
                    "evidence",
                    e.target.checked
                      ? [...data.evidence, key as keyof typeof EVIDENCE]
                      : data.evidence.filter((x) => x !== key),
                  )
                }
              />
              {value}
            </label>
          ))}
        </div>
        <label>
          Čo a kedy bolo overené
          <textarea
            rows={2}
            disabled={!canWrite}
            value={data.evidence_note}
            onChange={(e) => change("evidence_note", e.target.value)}
            placeholder="Uveď konkrétny výsledok a spôsob overenia."
          />
        </label>
      </fieldset>
      {data.type === "task" && (
        <div className="ws-grid3">
          <label>
            Stav
            <select
              disabled={!canWrite}
              value={data.task_status}
              onChange={(e) =>
                change(
                  "task_status",
                  e.target.value as DocumentData["task_status"],
                )
              }
            >
              {Object.entries(TASK_STATUS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label>
            Zodpovednosť
            <input
              disabled={!canWrite}
              value={data.assignee}
              onChange={(e) => change("assignee", e.target.value)}
            />
          </label>
          <label>
            Oblasť práce
            <input
              disabled={!canWrite}
              value={data.area}
              onChange={(e) => change("area", e.target.value)}
            />
          </label>
          <label>
            Súvisiace súbory a komponenty
            <textarea
              disabled={!canWrite}
              defaultValue={data.files.join("\n")}
              onBlur={(e) =>
                change("files", e.target.value.split("\n").filter(Boolean))
              }
            />
          </label>
          <label>
            Výsledok
            <textarea
              disabled={!canWrite}
              value={data.result}
              onChange={(e) => change("result", e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="ws-row ws-toolbar">
        <strong>Obsah</strong>
        <div className="ws-spacer" />
        {canWrite && (
          <button className="secondary" onClick={() => setPreview(!preview)}>
            {preview ? "Upraviť Markdown" : "Zobraziť náhľad"}
          </button>
        )}
      </div>
      {preview ? (
        <Markdown>{data.content}</Markdown>
      ) : (
        <textarea
          className="ws-source"
          aria-label="Obsah v Markdowne"
          value={data.content}
          onChange={(e) => change("content", e.target.value)}
          spellCheck={false}
        />
      )}
      {document.id && canWrite && (
        <label className="ws-upload">
          Pridať prílohu (do 3 MB)
          <input
            type="file"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {data.claims.length > 0 && (
        <details>
          <summary>
            Tvrdenia a dôkazy v pôvodnom zdroji ({data.claims.length})
          </summary>
          {data.claims.map((claim, i) => (
            <article key={i} className="ws-panel">
              <span className={`ws-badge ${claim.validity}`}>
                {VALIDITY[claim.validity]}
              </span>
              <p className="ws-muted">
                {claim.evidence.map((e) => EVIDENCE[e]).join(" · ")} ·{" "}
                {claim.observed_at}
              </p>
              <Markdown>{claim.text}</Markdown>
            </article>
          ))}
        </details>
      )}
      {data.replaced_by && (
        <p>
          Tento záznam nahradil{" "}
          <a href={`/workspace?document=${data.replaced_by}`}>novší záznam</a>.
        </p>
      )}
      <details>
        <summary>Zdroje a väzby</summary>
        <label>
          Zdroje — jeden odkaz alebo cesta na riadok
          <textarea
            disabled={!canWrite}
            defaultValue={data.sources.map((s) => s.uri).join("\n")}
            onBlur={(e) =>
              change(
                "sources",
                e.target.value
                  .split("\n")
                  .filter(Boolean)
                  .map(
                    (uri) =>
                      data.sources.find((s) => s.uri === uri) || {
                        uri,
                        label: uri,
                      },
                  ),
              )
            }
          />
        </label>
        <label>
          Prepojené záznamy — ID na samostatných riadkoch
          <textarea
            disabled={!canWrite}
            defaultValue={data.links.join("\n")}
            onBlur={(e) =>
              change(
                "links",
                e.target.value
                  .split("\n")
                  .map((x) => x.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
        {data.links.map((id) => (
          <a key={id} href={`/workspace?project=${project}&document=${id}`}>
            Otvoriť záznam {id.slice(0, 8)} ↗
          </a>
        ))}
      </details>
      <div className="ws-row ws-actions">
        {canWrite && (
          <button disabled={busy} onClick={() => void save()}>
            {busy ? "Ukladám…" : "Uložiť revíziu"}
          </button>
        )}
        {document.id && (
          <button className="secondary" onClick={() => void loadHistory()}>
            História a porovnanie
          </button>
        )}
        {document.id && canWrite && data.type === "task" && (
          <>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => void save("claim_task")}
            >
              Prevziať úlohu
            </button>
            <button
              className="secondary"
              onClick={() => setShowHandoff(!showHandoff)}
            >
              Odovzdať úlohu
            </button>
          </>
        )}
        {document.id && canWrite && !document.archived && (
          <button
            className="secondary"
            disabled={busy}
            onClick={() => void save("archive_document")}
          >
            Archivovať
          </button>
        )}
      </div>
      {document.claim_until && (
        <p>
          Prevzatie platí do {date(document.claim_until)}.{" "}
          {Date.parse(document.claim_until) < loadedAt
            ? "Platnosť už vypršala."
            : ""}
        </p>
      )}
      {showHandoff && (
        <fieldset>
          <legend>Odovzdanie úlohy</legend>
          {Object.entries({
            changed: "Čo sa zmenilo",
            verified: "Čo bolo overené a ako",
            uncertain: "Čo zostáva neisté",
            artifact: "Commit alebo artefakt",
            next: "Ďalší konkrétny krok",
          }).map(([k, v]) => (
            <label key={k}>
              {v}
              <textarea
                value={handoff[k as keyof typeof handoff]}
                onChange={(e) =>
                  setHandoff((old) => ({ ...old, [k]: e.target.value }))
                }
              />
            </label>
          ))}
          <button
            disabled={busy}
            onClick={() =>
              void save("append_handoff", {
                handoff,
                task_status:
                  data.task_status === "active" ? "open" : data.task_status,
              })
            }
          >
            Uložiť odovzdanie
          </button>
        </fieldset>
      )}
      {data.handoffs.length > 0 && (
        <details>
          <summary>Predchádzajúce odovzdania ({data.handoffs.length})</summary>
          {data.handoffs.map((h, i) => (
            <article key={i}>
              <strong>{date(h.at)}</strong>
              <p>{h.changed}</p>
              <p>Overenie: {h.verified}</p>
              <p>Neistoty: {h.uncertain}</p>
              <p>Ďalej: {h.next}</p>
              <p>{h.artifact}</p>
            </article>
          ))}
        </details>
      )}
      {history.length > 0 && (
        <section>
          <h2>História revízií</h2>
          <div className="ws-row">
            {history.map((r) => (
              <button
                key={r.revision}
                className="secondary"
                onClick={() => setCompare(r)}
              >
                r{r.revision} · {date(r.created_at)}
              </button>
            ))}
          </div>
          {compare && (
            <>
              <h3>Revízia {compare.revision} → aktuálny obsah</h3>
              <div className="ws-diff">
                {rows.map((r, i) => (
                  <div key={i} className={r.kind}>
                    {r.kind === "added"
                      ? "+ "
                      : r.kind === "removed"
                        ? "− "
                        : "  "}
                    {r.line}
                  </div>
                ))}
              </div>
              {canWrite && (
                <button
                  disabled={busy}
                  onClick={() =>
                    void save("restore_document", {
                      revision: compare.revision,
                    })
                  }
                >
                  Obnoviť ako novú revíziu
                </button>
              )}
            </>
          )}
          {history.length % 50 === 0 && (
            <button
              className="secondary"
              onClick={async () => {
                try {
                  setHistory([
                    ...history,
                    ...(
                      await api<{ items: Revision[] }>("get_document_history", {
                        id: document.id,
                        offset: history.length,
                      })
                    ).items,
                  ]);
                } catch (e) {
                  setError(message(e));
                }
              }}
            >
              Staršie revízie
            </button>
          )}
        </section>
      )}
    </section>
  );
}
function diffLines(before: string, after: string) {
  const a = before.split("\n"),
    b = after.split("\n");
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length,
    endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }
  return [
    ...a.slice(0, start).map((line) => ({ line, kind: "same" })),
    ...a.slice(start, endA).map((line) => ({ line, kind: "removed" })),
    ...b.slice(start, endB).map((line) => ({ line, kind: "added" })),
    ...b.slice(endB).map((line) => ({ line, kind: "same" })),
  ];
}
