import { zipSync, strToU8 } from "fflate";
import { requestToken } from "@/lib/workspace/auth";
import { execute } from "@/lib/workspace/service";
import { rpc, WorkspaceError } from "@/lib/workspace/storage";
import { errorResponse, PRIVATE_HEADERS } from "@/lib/workspace/http";
import type { WorkspaceDocument, Revision } from "@/lib/workspace/types";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    const token = await requestToken(req),
      project = new URL(req.url).searchParams.get("project");
    const data = (await execute("export_project", { project }, token)) as {
      documents: WorkspaceDocument[];
      revisions: Revision[];
      attachments: Array<{
        id: string;
        name: string;
        sha256: string;
        bytes: number;
      }>;
      project: { slug: string };
    };
    const files: Record<string, Uint8Array> = {
      "project.json": strToU8(JSON.stringify(data, null, 2)),
    };
    for (const d of data.documents)
      files[`documents/${d.id}.md`] = strToU8(
        `# ${d.data.title}\n\nID: ${d.id}\nRevízia: ${d.revision}\n\n${d.data.content}`,
      );
    for (const r of data.revisions)
      files[`history/${r.document_id}/${r.revision}.md`] = strToU8(
        r.snapshot.data.content,
      );
    for (const a of data.attachments) {
      const result = await rpc<{ base64: string }>(
        "download_attachment",
        { project, attachment_id: a.id },
        token,
      );
      const bytes = Buffer.from(result.base64, "base64");
      const digest = (await import("node:crypto"))
        .createHash("sha256")
        .update(bytes)
        .digest("hex");
      if (digest !== a.sha256 || bytes.length !== a.bytes)
        throw new WorkspaceError("unavailable", 503);
      files[`attachments/${a.id}`] = bytes;
    }
    files["README.md"] = strToU8(
      "# Export projektu BendaLabs Workspace\n\nproject.json obsahuje ID, revízie, väzby, audit a manifest príloh. documents/ obsahuje aktuálny Markdown, history/ všetky revízie a attachments/ overené binárne prílohy pod stabilnými ID. Pri obnove zachovaj ID a revízie. Heslá, relácie ani prístupové tokeny sa neexportujú. Úložisko prístupov sa zálohuje oddelene.\n",
    );
    const archive = zipSync(files, { level: 6 });
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let offset = 0; offset < archive.length; offset += 65536)
          controller.enqueue(archive.slice(offset, offset + 65536));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        ...PRIVATE_HEADERS,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${data.project.slug}.zip"`,
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
