import { boundedBody, errorResponse, json } from "@/lib/workspace/http";
import { hash, rpc } from "@/lib/workspace/storage";
export async function POST(req: Request) {
  try {
    const form = new URLSearchParams(await boundedBody(req, 4000));
    await rpc("revoke_token", {
      hash: hash(form.get("token") || ""),
      client_id: form.get("client_id"),
    });
    return json({});
  } catch (e) {
    return errorResponse(e);
  }
}
