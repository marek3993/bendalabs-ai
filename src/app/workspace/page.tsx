import Link from "next/link";
import { identity, sessionToken } from "@/lib/workspace/auth";
import { rpc } from "@/lib/workspace/storage";
import type { Project } from "@/lib/workspace/types";
import { WorkspaceApp } from "@/components/workspace/app";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const query = await searchParams;
  let user;
  let unavailable = false;
  try {
    user = await identity();
  } catch {
    unavailable = true;
  }
  if (!user)
    return (
      <main className="ws-login">
        <Link href="/" className="ws-wordmark">
          BendaLabs<span>●</span>
        </Link>
        <p className="ws-eyebrow">Súkromný pracovný priestor</p>
        <h1>
          Všetko podstatné.
          <br />
          Na jednom mieste.
        </h1>
        <p>Projekty, rozhodnutia a overené výsledky pre tvoj tím.</p>
        {unavailable ? (
          <p role="alert">Prihlásenie je dočasne nedostupné.</p>
        ) : (
          <form action="/workspace/login" method="post">
            <input
              type="hidden"
              name="next"
              value={query.next || "/workspace"}
            />
            <label>
              Používateľ
              <input
                name="username"
                autoComplete="username"
                required
                defaultValue="marek"
              />
            </label>
            <label>
              Heslo
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={200}
              />
            </label>
            {query.login === "failed" && (
              <p role="alert">
                Prihlásenie sa nepodarilo. Skontroluj údaje alebo to skús
                neskôr.
              </p>
            )}
            <button>Prihlásiť sa</button>
          </form>
        )}
      </main>
    );
  const { items } = await rpc<{ items: Project[] }>(
    "list_projects",
    {},
    await sessionToken(),
  );
  return (
    <WorkspaceApp
      identity={user}
      projects={items}
      initialProject={query.project}
      initialDocument={query.document}
    />
  );
}
