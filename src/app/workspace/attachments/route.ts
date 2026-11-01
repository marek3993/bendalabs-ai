import { requestToken } from "@/lib/workspace/auth";
import { rpc, WorkspaceError } from "@/lib/workspace/storage";
import { errorResponse, json, PRIVATE_HEADERS } from "@/lib/workspace/http";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const token = await requestToken(req, true);
    if (Number(req.headers.get("content-length")) > 3100000)
      throw new WorkspaceError("invalid_input", 413);
    const form = await req.formData(),
      file = form.get("file");
    if (!(file instanceof File) || file.size > 3000000)
      throw new WorkspaceError("invalid_input", 400);
    return json(
      await rpc(
        "upload_attachment",
        {
          project: form.get("project"),
          document_id: form.get("document_id") || null,
          name: file.name,
          mime: file.type,
          base64: Buffer.from(await file.arrayBuffer()).toString("base64"),
        },
        token,
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function GET(req: Request) {
  try {
    const token = await requestToken(req);
    const params = new URL(req.url).searchParams;
    const file = await rpc<{ base64: string; name: string; mime: string }>(
      "download_attachment",
      { project: params.get("project"), attachment_id: params.get("id") },
      token,
    );
    const inline = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/gif",
    ].includes(file.mime);
    return new Response(Buffer.from(file.base64, "base64"), {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": inline ? file.mime : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
