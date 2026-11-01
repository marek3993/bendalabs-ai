import { serverMetadata } from "@/lib/workspace/oauth";
export function GET() {
  return Response.json(serverMetadata(), {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
