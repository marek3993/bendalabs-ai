import { execute } from "@/lib/workspace/service";
import { requestToken } from "@/lib/workspace/auth";
import { boundedBody, errorResponse, json } from "@/lib/workspace/http";
import { WorkspaceError } from "@/lib/workspace/storage";
export const dynamic = "force-dynamic";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ operation: string }> },
) {
  try {
    const token = await requestToken(req, true);
    const { operation } = await params;
    let input: unknown;
    try {
      input = JSON.parse(await boundedBody(req));
    } catch {
      throw new WorkspaceError("invalid_input", 400);
    }
    return json(await execute(operation, input, token));
  } catch (e) {
    return errorResponse(e);
  }
}
