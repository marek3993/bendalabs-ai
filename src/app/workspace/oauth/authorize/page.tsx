import { redirect } from "next/navigation";
import { identity, sessionToken } from "@/lib/workspace/auth";
import { authorization } from "@/lib/workspace/oauth";
import { rpc } from "@/lib/workspace/storage";
import type { Project } from "@/lib/workspace/types";
export const dynamic = "force-dynamic";
export default async function Authorize({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const query = await searchParams;
  if (!(await identity()))
    redirect(
      `/workspace?next=${encodeURIComponent(`/workspace/oauth/authorize?${new URLSearchParams(query)}`)}`,
    );
  let request;
  try {
    request = await authorization(query);
  } catch {
    return (
      <main className="ws-login">
        <h1>Neplatná požiadavka na pripojenie</h1>
        <a href="/workspace">Späť do pracovného priestoru</a>
      </main>
    );
  }
  const { items } = await rpc<{ items: Project[] }>(
    "list_projects",
    {},
    await sessionToken(),
  );
  return (
    <main className="ws-login">
      <p className="ws-eyebrow">BendaLabs Workspace</p>
      <h1>Pripojiť {request.client.name}?</h1>
      <p>
        Pripojenie bude pracovať pod tvojím menom. Prístup môžeš kedykoľvek
        odvolať v nastaveniach.
      </p>
      <p>
        Návratová adresa:{" "}
        <strong>{new URL(request.params.redirect_uri).host}</strong>
      </p>
      <form method="post" action="/workspace/oauth/consent">
        {Object.entries(request.params).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <label>
          Názov pripojenia
          <input
            name="name"
            required
            maxLength={150}
            defaultValue={request.client.name}
          />
        </label>
        <fieldset>
          <legend>Povolené projekty</legend>
          {items.map((p) => (
            <label key={p.id} className="ws-check">
              <input
                type="checkbox"
                name="projects"
                value={p.id}
                disabled={
                  request.params.scope.includes("write") && p.role === "reader"
                }
              />
              {p.name}
            </label>
          ))}
        </fieldset>
        <p>
          Oprávnenia:{" "}
          <strong>
            {request.params.scope.includes("write")
              ? "Čítanie a zápis"
              : "Iba čítanie"}
          </strong>
        </p>
        <button type="submit">Povoliť pripojenie</button>
        <a className="ws-button secondary" href="/workspace">
          Zrušiť
        </a>
      </form>
    </main>
  );
}
