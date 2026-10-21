import { z } from "zod";
import { appendLifeConversation, explicitlyRequestsMemory, generateLifeReply, lifeAiRateMessage, LifeAiError } from "@/lib/life/assistant";
import { lifeError, lifeJson, loadValidatedLifeState, readLifeJson, requireLifeRequest } from "@/lib/life/api";
import { applyLifeCommand } from "@/lib/life/domain";
import { claimLifeAiUsage, releaseLifeAiUsage, saveLifeState } from "@/lib/life/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const inputSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  expectedVersion: z.number().int().min(0).optional(),
  // Accepted for older clients. Canonical history always comes from storage.
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(10000) })).max(40).optional(),
  threadId: z.string().max(100).optional(),
}).strict();

export async function POST(request: Request) {
  let leaseId: string | undefined;
  try {
    const session = await requireLifeRequest(request, true);
    const input = inputSchema.parse(await readLifeJson(request, 160_000));
    const current = await loadValidatedLifeState();
    if (input.expectedVersion !== undefined && input.expectedVersion !== current.version) return lifeJson({ error: "Priestor sa medzitým zmenil. Obnov ho a odošli správu znova." }, 409);
    const rate = await claimLifeAiUsage(session.id, "chat");
    if (!rate.allowed) {
      const response = lifeJson({ error: lifeAiRateMessage(rate.retryAfter), retryAfter: rate.retryAfter }, 429);
      response.headers.set("Retry-After", String(rate.retryAfter));
      return response;
    }
    leaseId = rate.leaseId;
    let answer;
    try { answer = await generateLifeReply(current.state, input.message); }
    catch (error) {
      return lifeJson({ error: error instanceof LifeAiError ? error.message : "AI sa teraz nepodarilo spojiť. Správa ani navrhované zmeny sa neuložili. Skús to znova." }, error instanceof LifeAiError ? error.status : 503);
    }
    let next = current.state;
    const memoryIds = new Set<string>();
    if (explicitlyRequestsMemory(input.message)) {
      for (const proposal of answer.proposals) {
        if (proposal.command.type !== "upsert" || proposal.command.collection !== "memories" || !proposal.command.record.active) continue;
        const command = { ...proposal.command, record: { ...proposal.command.record, source: `Rozhovor • ${new Date().toISOString().slice(0, 10)}` } };
        next = applyLifeCommand(next, command);
        memoryIds.add(proposal.id);
      }
    }
    const proposals = answer.proposals.filter(item => !memoryIds.has(item.id));
    const receipt = memoryIds.size ? `\n\nUložené do pamäte (${memoryIds.size}). Pravidlá nájdeš aj s históriou v sekcii Pamäť.` : "";
    const warnings = answer.warnings.length ? `\n\n${answer.warnings.join("\n")}` : "";
    const reply = `${answer.reply}${receipt}${warnings}`.slice(0, 10000);
    next = appendLifeConversation(next, input.message, reply);
    // Conversation and explicit memories form one compare-and-swap write. Never
    // return an "uložené" receipt unless that write actually succeeds.
    const saved = await saveLifeState(next, current.version);
    return lifeJson({ reply, ...saved, proposals, memorySaved: memoryIds.size > 0, model: answer.model, usage: answer.usage });
  } catch (error) { return lifeError(error); }
  finally { if (leaseId) await releaseLifeAiUsage(leaseId).catch(() => undefined); }
}
