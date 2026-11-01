import "server-only";
import { schemas, type Operation } from "./operations";
import { passwordHash } from "./auth";
import { rpc, WorkspaceError } from "./storage";

export async function execute(
  operation: string,
  input: unknown,
  token: string,
): Promise<unknown> {
  if (!Object.hasOwn(schemas, operation))
    throw new WorkspaceError("invalid_input", 400);
  const parsed = schemas[operation as Operation].safeParse(input);
  if (!parsed.success)
    throw new WorkspaceError("invalid_input", 400, {
      fields: parsed.error.issues
        .map((i) => ({ path: i.path.join("."), message: i.message }))
        .slice(0, 10),
    });
  const payload = parsed.data as Record<string, unknown>;
  if (operation === "manage_member") {
    await rpc("whoami", {}, token);
    if (payload.role !== "remove" && !payload.password)
      throw new WorkspaceError("invalid_input", 400);
    payload.password_hash = payload.password
      ? passwordHash(payload.password as string)
      : null;
    delete payload.password;
  }
  const result = await rpc<Record<string, unknown>>(operation, payload, token);
  if (operation === "get_project_context") {
    const items = (result.items as Array<Record<string, unknown>>).map(
      (item) => {
        const d = item.data as Record<string, unknown>;
        return {
          id: item.id,
          revision: item.revision,
          updated_at: item.updated_at,
          title: d.title,
          type: d.type,
          validity: d.validity,
          evidence: d.evidence,
          task_status: d.task_status,
          assignee: d.assignee,
          area: d.area,
          excerpt: String(item.excerpt || "").slice(0, 900),
          sources: ((d.sources as unknown[]) || []).slice(0, 2),
        };
      },
    );
    while (JSON.stringify(items).length > 20000) items.pop();
    return {
      ...result,
      items,
      next_offset: Number(result.offset || 0) + items.length,
      detail_tool: "get_document",
      content_is_data: true,
    };
  }
  return result;
}
