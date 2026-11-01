"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EVIDENCE,
  TASK_STATUS,
  TYPES,
  VALIDITY,
  emptyDocument,
  type Identity,
  type Project,
  type WorkspaceDocument,
} from "@/lib/workspace/types";
import { api, date, message } from "./client";
import { Editor } from "./editor";

type Filters = {
  q: string;
  type: string;
  validity: string;
  evidence: string;
  tag: string;
  author: string;
  since: string;
  until: string;
  task_status: string;
  include_invalid: boolean;
};
const cleanFilters: Filters = {
  q: "",
  type: "",
  validity: "",
  evidence: "",
  tag: "",
  author: "",
  since: "",
  until: "",
  task_status: "",
  include_invalid: false,
};
type Preferences = {
  favorites: string[];
  filters: Array<{ name: string; project: string } & Partial<Filters>>;
};
type Connection = {
  id: string;
  name: string;
  scope: string;
  project_ids: string[];
  revoked_at: string | null;
  created_at: string;
};
export function WorkspaceApp({
  identity,
  projects: initialProjects,
  initialProject,
  initialDocument,
}: {
  identity: Identity;
  projects: Project[];
  initialProject?: string;
  initialDocument?: string;
}) {
  const [projects, setProjects] = useState(initialProjects),
    [project, setProject] = useState(
      initialProjects.find(
        (p) => p.slug === initialProject || p.id === initialProject,
      ) || initialProjects[0],
    );
  const [view, setView] = useState("overview"),
    [documents, setDocuments] = useState<WorkspaceDocument[]>([]),
    [selected, setSelected] = useState<WorkspaceDocument | null>(null),
    [filters, setFilters] = useState<Filters>(cleanFilters),
    [preferences, setPreferences] = useState<Preferences>({
      favorites: [],
      filters: [],
    }),
    [connections, setConnections] = useState<Connection[]>([]),
    [activity, setActivity] = useState<Array<Record<string, unknown>>>([]),
    [attachments, setAttachments] = useState<Array<Record<string, unknown>>>(
      [],
    ),
    [members, setMembers] = useState<
      Array<{ id: string; name: string; username: string; role: string }>
    >([]);
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [offset, setOffset] = useState(0),
    [hasMore, setHasMore] = useState(false),
    [refresh, setRefresh] = useState(0),
    [favoriteOnly, setFavoriteOnly] = useState(false);
  const canWrite = project?.role !== "reader";
  useEffect(() => {
    api<Preferences>("get_preferences")
      .then(setPreferences)
      .catch((e) => setError(message(e)));
  }, []);
  useEffect(() => {
    if (initialDocument)
      api<WorkspaceDocument>("get_document", { id: initialDocument })
        .then((d) => {
          setSelected(d);
          const found = initialProjects.find((p) => p.id === d.project_id);
          if (found) setProject(found);
        })
        .catch((e) => setError(message(e)));
  }, [initialDocument, initialProjects]);
  useEffect(() => {
    if (!project) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const p = { project: project.slug };
        if (view === "settings") {
          const [c, m] = await Promise.all([
            api<{ items: Connection[] }>("list_connections"),
            api<{ items: typeof members }>("list_members", p),
          ]);
          if (active) {
            setConnections(c.items);
            setMembers(m.items);
          }
        } else if (view === "activity") {
          const a = await api<{ items: Array<Record<string, unknown>> }>(
            "get_activity",
            { ...p, offset },
          );
          if (active) {
            setActivity(a.items);
            setHasMore(a.items.length === 50);
          }
        } else if (view === "attachments") {
          const a = await api<{ items: Array<Record<string, unknown>> }>(
            "list_attachments",
            p,
          );
          if (active) setAttachments(a.items);
        } else {
          const applied = Object.fromEntries(
            Object.entries(filters).filter(([, v]) => v !== ""),
          );
          const result = await api<{ items: WorkspaceDocument[] }>(
            view === "tasks" ? "list_tasks" : "search_project",
            { ...p, ...applied, offset, limit: view === "overview" ? 100 : 30 },
          );
          if (active) {
            setDocuments(result.items);
            setHasMore(
              result.items.length === (view === "overview" ? 100 : 30),
            );
          }
        }
      } catch (e) {
        if (active) setError(message(e));
      } finally {
        if (active) setLoading(false);
      }
    };
    const timer = setTimeout(() => void load(), filters.q ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [project, view, filters, offset, refresh]);
  const open = async (id: string) => {
    setError("");
    try {
      const d = await api<WorkspaceDocument>("get_document", { id });
      setSelected(d);
      history.replaceState(
        null,
        "",
        `/workspace?project=${project.slug}&document=${id}`,
      );
    } catch (e) {
      setError(message(e));
    }
  };
  const setPref = async (next: Preferences) => {
    try {
      await api("save_preferences", {
        ...next,
        filters: next.filters.map((f) =>
          Object.fromEntries(
            Object.entries(f).filter(([, value]) => value !== ""),
          ),
        ),
      });
      setPreferences(next);
    } catch (e) {
      setError(message(e));
    }
  };
  function navigate(value: string) {
    setView(value);
    setSelected(null);
    setOffset(0);
    setFilters(cleanFilters);
    setFavoriteOnly(false);
    history.replaceState(null, "", `/workspace?project=${project.slug}`);
  }
  function create() {
    setSelected({
      id: "",
      project_id: project.id,
      revision: 0,
      data: emptyDocument(),
      author_id: identity.id,
      author_name: identity.name,
      connection_id: null,
      connection_name: null,
      updated_at: new Date().toISOString(),
      archived: false,
      claim_until: null,
      claimed_by: null,
      claimed_connection: null,
    });
  }
  const cards = (items: WorkspaceDocument[]) =>
    items.map((d) => (
      <article key={d.id} className="ws-card">
        <div className="ws-row">
          <span className={`ws-badge ${d.data.validity}`}>
            {VALIDITY[d.data.validity]}
          </span>
          <span className="ws-muted">r{d.revision}</span>
          <div className="ws-spacer" />
          <button
            className="ws-star"
            aria-label={
              preferences.favorites.includes(d.id)
                ? "Odstrániť z obľúbených"
                : "Pridať do obľúbených"
            }
            onClick={() =>
              void setPref({
                ...preferences,
                favorites: preferences.favorites.includes(d.id)
                  ? preferences.favorites.filter((x) => x !== d.id)
                  : [...preferences.favorites, d.id],
              })
            }
          >
            {preferences.favorites.includes(d.id) ? "★" : "☆"}
          </button>
        </div>
        <button className="ws-title" onClick={() => void open(d.id)}>
          {d.data.title}
        </button>
        <p>{d.excerpt || "Bez úryvku"}</p>
        <div className="ws-row ws-muted">
          <span>{TYPES[d.data.type]}</span>
          {d.data.type === "task" && (
            <span>
              {TASK_STATUS[d.data.task_status]} ·{" "}
              {d.data.assignee || "Bez zodpovednosti"}
            </span>
          )}
        </div>
        {d.claim_until && Date.parse(d.claim_until) > Date.now() && (
          <p className="ws-claim">Práve prevzatá do {date(d.claim_until)}</p>
        )}
        {d.data.type === "task" &&
          d.data.area &&
          documents.some(
            (other) =>
              other.id !== d.id &&
              other.data.area?.trim().toLowerCase() ===
                d.data.area.trim().toLowerCase() &&
              other.claim_until &&
              Date.parse(other.claim_until) > Date.now(),
          ) && (
            <p className="ws-claim">
              V rovnakej oblasti už prebieha práca. Pred prevzatím skontroluj
              súvisiace úlohy.
            </p>
          )}
        <div className="ws-row ws-meta">
          <span>
            {d.author_name}
            {d.connection_name ? ` / ${d.connection_name}` : ""}
          </span>
          <span>{date(d.updated_at)}</span>
        </div>
      </article>
    ));
  return (
    <div className="ws-shell">
      <aside className="ws-sidebar">
        <Link href="/" className="ws-wordmark">
          BendaLabs<span>●</span>
        </Link>
        <p className="ws-eyebrow">Workspace</p>
        <label className="ws-project-label">
          Projekt
          <select
            value={project?.id || ""}
            onChange={(e) => {
              setProject(projects.find((p) => p.id === e.target.value)!);
              setSelected(null);
              setOffset(0);
              setFilters(cleanFilters);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <nav aria-label="Pracovný priestor">
          {Object.entries({
            overview: "Prehľad",
            documents: "Záznamy",
            tasks: "Úlohy",
            attachments: "Prílohy",
            activity: "História zmien",
            settings: "Prístupy a nastavenia",
          }).map(([k, v]) => (
            <button
              key={k}
              className={view === k ? "active" : ""}
              onClick={() => navigate(k)}
            >
              {v}
            </button>
          ))}
        </nav>
        <div className="ws-sidebar-bottom">
          <strong>{identity.name}</strong>
          <span>
            {
              { owner: "Vlastník", editor: "Editor", reader: "Čitateľ" }[
                project?.role || "reader"
              ]
            }
          </span>
          <form method="post" action="/workspace/logout">
            <button className="secondary">Odhlásiť sa</button>
          </form>
        </div>
      </aside>
      <main className="ws-main">
        <header className="ws-page-header">
          <div>
            <p className="ws-eyebrow">Súkromný projekt</p>
            <h1>{project?.name || "Tvoje projekty"}</h1>
          </div>
          {project && canWrite && !selected && (
            <button onClick={create}>+ Nový záznam</button>
          )}
        </header>
        {error && (
          <p className="ws-alert" role="alert">
            {error}
          </p>
        )}
        {!project && (
          <p>Zatiaľ nemáš pridelený projekt. Prístup prideľuje vlastník.</p>
        )}
        {selected ? (
          <Editor
            key={`${selected.id}:${selected.revision}`}
            document={selected}
            project={project.slug}
            canWrite={canWrite}
            onClose={() => setSelected(null)}
            onSaved={(d) => {
              setSelected(d);
              setRefresh((r) => r + 1);
            }}
          />
        ) : (
          <>
            {loading && (
              <p role="status" className="ws-muted">
                Načítavam…
              </p>
            )}
            {project && view === "overview" && (
              <>
                <div className="ws-summary">
                  <div>
                    <span>Aktuálne záznamy</span>
                    <strong>
                      {documents.length}
                      {hasMore ? "+" : ""}
                    </strong>
                  </div>
                  <div>
                    <span>Overené s dôkazmi</span>
                    <strong>
                      {
                        documents.filter((d) => d.data.validity === "verified")
                          .length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Rozpracované úlohy</span>
                    <strong>
                      {
                        documents.filter(
                          (d) =>
                            d.data.type === "task" &&
                            d.data.task_status !== "done",
                        ).length
                      }
                    </strong>
                  </div>
                  <div>
                    <span>Blokery</span>
                    <strong>
                      {
                        documents.filter(
                          (d) =>
                            d.data.task_status === "blocked" ||
                            d.data.type === "problem",
                        ).length
                      }
                    </strong>
                  </div>
                </div>
                <p className="ws-muted">
                  Prehľad z najnovších {documents.length} záznamov. Druh dôkazu
                  je uvedený pri každom overenom výsledku.
                </p>
                {[
                  [
                    "Aktuálny stav a konfigurácia",
                    documents.filter((d) =>
                      ["overview", "configuration", "rules"].includes(
                        d.data.type,
                      ),
                    ),
                  ],
                  [
                    "Čo funguje",
                    documents.filter((d) => d.data.validity === "verified"),
                  ],
                  [
                    "Blokery a otvorené otázky",
                    documents.filter(
                      (d) =>
                        d.data.type === "problem" ||
                        d.data.task_status === "blocked",
                    ),
                  ],
                  [
                    "Rozpracované úlohy",
                    documents.filter(
                      (d) =>
                        d.data.type === "task" && d.data.task_status !== "done",
                    ),
                  ],
                  ["Posledné zmeny", documents.slice(0, 6)],
                ].map(([title, items]) => (
                  <section key={title as string}>
                    <h2>{title as string}</h2>
                    <div className="ws-cards">
                      {(items as WorkspaceDocument[]).length ? (
                        cards((items as WorkspaceDocument[]).slice(0, 6))
                      ) : (
                        <p className="ws-empty">Zatiaľ bez záznamov.</p>
                      )}
                    </div>
                  </section>
                ))}
              </>
            )}
            {project && ["documents", "tasks"].includes(view) && (
              <>
                <div className="ws-search">
                  <label>
                    Vyhľadať
                    <input
                      type="search"
                      placeholder="Názov, obsah, komponent alebo chyba…"
                      value={filters.q}
                      onChange={(e) => {
                        setFilters({ ...filters, q: e.target.value });
                        setOffset(0);
                      }}
                    />
                  </label>
                  <details>
                    <summary>Filtre a uložené pohľady</summary>
                    <div className="ws-grid3">
                      {[
                        ["type", "Typ", TYPES],
                        ["validity", "Platnosť", VALIDITY],
                        ["evidence", "Druh dôkazu", EVIDENCE],
                        ["task_status", "Stav úlohy", TASK_STATUS],
                      ].map(([key, label, values]) => (
                        <label key={String(key)}>
                          {String(label)}
                          <select
                            value={String(filters[key as keyof Filters])}
                            onChange={(e) => {
                              setFilters({
                                ...filters,
                                [key as string]: e.target.value,
                              });
                              setOffset(0);
                            }}
                          >
                            <option value="">Všetky</option>
                            {Object.entries(values).map(([k, v]) => (
                              <option key={k} value={k}>
                                {v}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                      {[
                        ["tag", "Tag / komponent"],
                        ["author", "ID autora"],
                        ["since", "Od dátumu"],
                        ["until", "Do dátumu"],
                      ].map(([k, label]) => (
                        <label key={k}>
                          {label}
                          <input
                            type={
                              ["since", "until"].includes(k) ? "date" : "text"
                            }
                            value={String(filters[k as keyof Filters])}
                            onChange={(e) => {
                              setFilters({ ...filters, [k]: e.target.value });
                              setOffset(0);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <div className="ws-row">
                      <label className="ws-check">
                        <input
                          type="checkbox"
                          checked={filters.include_invalid}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              include_invalid: e.target.checked,
                            })
                          }
                        />
                        Zahrnúť neplatné a archivované
                      </label>
                      <label className="ws-check">
                        <input
                          type="checkbox"
                          checked={favoriteOnly}
                          onChange={(e) => setFavoriteOnly(e.target.checked)}
                        />
                        Obľúbené na tejto strane
                      </label>
                      <button
                        className="secondary"
                        onClick={() => {
                          const name = prompt("Názov uloženého filtra");
                          if (name)
                            void setPref({
                              ...preferences,
                              filters: [
                                ...preferences.filters,
                                { name, project: project.slug, ...filters },
                              ],
                            });
                        }}
                      >
                        Uložiť filter
                      </button>
                    </div>
                    <div className="ws-row">
                      {preferences.filters
                        .filter((f) => f.project === project.slug)
                        .map((f, i) => (
                          <button
                            key={i}
                            className="secondary"
                            onClick={() => {
                              setFilters(
                                Object.fromEntries(
                                  Object.entries(cleanFilters).map(
                                    ([key, value]) => [
                                      key,
                                      f[key as keyof Filters] ?? value,
                                    ],
                                  ),
                                ) as Filters,
                              );
                              setOffset(0);
                            }}
                          >
                            {f.name}
                          </button>
                        ))}
                    </div>
                  </details>
                </div>
                <div className="ws-cards">
                  {cards(
                    documents.filter(
                      (d) =>
                        !favoriteOnly || preferences.favorites.includes(d.id),
                    ),
                  )}
                </div>
                {!loading && !documents.length && (
                  <p className="ws-empty">
                    Tomuto výberu nezodpovedajú žiadne záznamy.
                  </p>
                )}
                <div className="ws-pagination">
                  <button
                    className="secondary"
                    disabled={!offset}
                    onClick={() => setOffset(Math.max(0, offset - 30))}
                  >
                    Predchádzajúca
                  </button>
                  <span>Strana {Math.floor(offset / 30) + 1}</span>
                  <button
                    className="secondary"
                    disabled={!hasMore}
                    onClick={() => setOffset(offset + 30)}
                  >
                    Ďalšia
                  </button>
                </div>
              </>
            )}
            {project && view === "attachments" && (
              <section>
                <h2>Súkromné prílohy</h2>
                <p>Nové prílohy pridáš pri úprave záznamu.</p>
                {attachments.map((a) => (
                  <a
                    className="ws-file"
                    key={String(a.id)}
                    href={`/workspace/attachments?project=${project.slug}&id=${a.id}`}
                  >
                    {String(a.name)}{" "}
                    <span>{Math.ceil(Number(a.bytes) / 1024)} kB</span>
                  </a>
                ))}
                {!attachments.length && !loading && (
                  <p className="ws-empty">Zatiaľ bez príloh.</p>
                )}
              </section>
            )}
            {project && view === "activity" && (
              <section>
                <h2>História zmien</h2>
                <div className="ws-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Čas</th>
                        <th>Používateľ</th>
                        <th>Pripojenie</th>
                        <th>Zmena</th>
                        <th>Revízia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activity.map((a) => (
                        <tr key={String(a.id)}>
                          <td>{date(String(a.created_at))}</td>
                          <td>{String(a.author_name)}</td>
                          <td>{String(a.connection_name || "Web")}</td>
                          <td>
                            {a.document_id ? (
                              <button
                                className="ws-link"
                                onClick={() => void open(String(a.document_id))}
                              >
                                {actionLabel(String(a.action))}
                              </button>
                            ) : (
                              actionLabel(String(a.action))
                            )}
                          </td>
                          <td>{String(a.revision || "—")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="ws-pagination">
                  <button
                    className="secondary"
                    disabled={!offset}
                    onClick={() => setOffset(Math.max(0, offset - 50))}
                  >
                    Novšie
                  </button>
                  <button
                    className="secondary"
                    disabled={!hasMore}
                    onClick={() => setOffset(offset + 50)}
                  >
                    Staršie
                  </button>
                </div>
              </section>
            )}
            {project && view === "settings" && (
              <section>
                <h2>Pripojenia AI</h2>
                <p>
                  Každé pripojenie má vlastné oprávnenia a záznamy v histórii.
                  Odvolanie sa prejaví pri nasledujúcom prístupe.
                </p>
                {connections.map((c) => (
                  <article className="ws-connection" key={c.id}>
                    <div>
                      <strong>{c.name}</strong>
                      <p>
                        {c.scope.includes("write")
                          ? "Čítanie a zápis"
                          : "Iba čítanie"}{" "}
                        ·{" "}
                        {c.project_ids
                          .map(
                            (id) =>
                              projects.find((p) => p.id === id)?.name ||
                              "Projekt",
                          )
                          .join(", ")}
                      </p>
                      <small>{date(c.created_at)}</small>
                    </div>
                    <button
                      className="secondary"
                      disabled={Boolean(c.revoked_at)}
                      onClick={async () => {
                        try {
                          await api("revoke_connection", { id: c.id });
                          setRefresh((r) => r + 1);
                        } catch (e) {
                          setError(message(e));
                        }
                      }}
                    >
                      {c.revoked_at ? "Odvolané" : "Odvolať prístup"}
                    </button>
                  </article>
                ))}
                {!connections.length && !loading && (
                  <p className="ws-empty">Zatiaľ žiadne pripojenie.</p>
                )}
                <h2>Členovia projektu</h2>
                {members.map((m) => (
                  <p key={m.id}>
                    <strong>{m.name}</strong> ·{" "}
                    {
                      (
                        {
                          owner: "Vlastník",
                          editor: "Editor",
                          reader: "Čitateľ",
                        } as Record<string, string>
                      )[m.role]
                    }
                  </p>
                ))}
                {project.role === "owner" && (
                  <form
                    className="ws-panel"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget;
                      const data = new FormData(form);
                      try {
                        await api("manage_member", {
                          project: project.slug,
                          username: data.get("username"),
                          name: data.get("name"),
                          role: data.get("role"),
                          ...(data.get("password")
                            ? { password: data.get("password") }
                            : {}),
                        });
                        form.reset();
                        setRefresh((r) => r + 1);
                      } catch (err) {
                        setError(message(err));
                      }
                    }}
                  >
                    <h3>Pridať alebo upraviť člena</h3>
                    <div className="ws-grid3">
                      <label>
                        Používateľské meno
                        <input name="username" required />
                      </label>
                      <label>
                        Meno
                        <input name="name" required />
                      </label>
                      <label>
                        Rola
                        <select name="role">
                          <option value="reader">Čitateľ</option>
                          <option value="editor">Editor</option>
                          <option value="owner">Vlastník projektu</option>
                          <option value="remove">Odobrať členstvo</option>
                        </select>
                      </label>
                      <label>
                        Heslo nového používateľa
                        <input
                          name="password"
                          type="password"
                          minLength={12}
                          autoComplete="new-password"
                        />
                      </label>
                    </div>
                    <p className="ws-muted">
                      Existujúcemu používateľovi sa heslo týmto formulárom
                      nemení.
                    </p>
                    <button>Uložiť členstvo</button>
                  </form>
                )}
                <h2>Prenositeľnosť</h2>
                <a
                  className="ws-button"
                  href={`/workspace/export?project=${project.slug}`}
                >
                  Stiahnuť projekt, históriu a prílohy
                </a>
                <p>
                  Export obsahuje Markdown, JSON a manifest príloh. Pri
                  chýbajúcej prílohe sa export preruší.
                </p>
                {identity.is_owner && (
                  <form
                    className="ws-panel"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget);
                      try {
                        await api("create_project", {
                          slug: f.get("slug"),
                          name: f.get("name"),
                        });
                        const list = await api<{ items: Project[] }>(
                          "list_projects",
                        );
                        setProjects(list.items);
                        setProject(
                          list.items.find((p) => p.slug === f.get("slug"))!,
                        );
                        navigate("overview");
                      } catch (err) {
                        setError(message(err));
                      }
                    }}
                  >
                    <h3>Nový projekt</h3>
                    <label>
                      Názov
                      <input name="name" required />
                    </label>
                    <label>
                      Krátky názov v odkaze
                      <input
                        name="slug"
                        required
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        placeholder="moj-projekt"
                      />
                    </label>
                    <button>Vytvoriť projekt</button>
                  </form>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
function actionLabel(action: string) {
  return (
    (
      {
        create_document: "Nový záznam",
        update_document: "Úprava záznamu",
        import_document: "Import dokumentu",
        restore_document: "Obnovenie revízie",
        archive_document: "Archivácia",
        claim_task: "Prevzatie úlohy",
        update_task: "Úprava úlohy",
        append_handoff: "Odovzdanie úlohy",
        add_attachment: "Pridaná príloha",
        manage_member: "Zmena členstva",
        create_project: "Nový projekt",
      } as Record<string, string>
    )[action] || "Zmena"
  );
}
