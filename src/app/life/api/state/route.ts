import { z } from "zod";
import { applyLifeCommand, lifeCommandSchema } from "@/lib/life/domain";
import { saveLifeState } from "@/lib/life/storage";
import { lifeCapabilities, lifeError, lifeJson, loadValidatedLifeState, readLifeJson, requireLifeRequest } from "@/lib/life/api";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try { await requireLifeRequest(request); return lifeJson({ ...await loadValidatedLifeState(), capabilities: lifeCapabilities() }); }
  catch (error) { return lifeError(error); }
}
const inputSchema = z.object({ expectedVersion: z.number().int().min(0), command: lifeCommandSchema.optional(), commands: z.array(lifeCommandSchema).min(1).max(500).optional() }).strict().refine(value => Boolean(value.command) !== Boolean(value.commands), "Použi jednu zmenu alebo zoznam zmien.");
export async function POST(request: Request) {
  try {
    await requireLifeRequest(request, true);
    const input = inputSchema.parse(await readLifeJson(request, 1000000));
    const current = await loadValidatedLifeState();
    if (current.version !== input.expectedVersion) return lifeJson({ error: "Údaje sa medzitým zmenili. Obnov prehľad a zopakuj zmenu." }, 409);
    const next = (input.commands ?? [input.command!]).reduce((state, command) => applyLifeCommand(state, command), current.state);
    if (next === current.state) return lifeJson({ ...current, capabilities: lifeCapabilities() });
    const saved = await saveLifeState(next, input.expectedVersion);
    return lifeJson({ ...saved, capabilities: lifeCapabilities() });
  } catch (error) { return lifeError(error); }
}
