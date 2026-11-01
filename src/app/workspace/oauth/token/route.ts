import { exchange } from "@/lib/workspace/oauth";
import { boundedBody, errorResponse, json } from "@/lib/workspace/http";
export async function POST(req: Request) {
  try {
    return json(
      await exchange(new URLSearchParams(await boundedBody(req, 12000))),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
