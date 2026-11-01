import { protectedMetadata } from "@/lib/workspace/oauth";
export function GET() {
  return Response.json(protectedMetadata(), {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
