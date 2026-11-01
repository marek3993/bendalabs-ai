import { z } from "zod";
import { schemas, DESCRIPTIONS } from "@/lib/workspace/operations";
import { origin } from "@/lib/workspace/auth";
export function GET() {
  const paths = Object.fromEntries(
    Object.entries(schemas).map(([name, schema]) => [
      `/workspace/api/${name}`,
      {
        post: {
          operationId: name,
          summary: DESCRIPTIONS[name as keyof typeof DESCRIPTIONS] || name,
          security: [{ oauth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: z.toJSONSchema(schema, { unrepresentable: "any" }),
              },
            },
          },
          responses: {
            200: { description: "Výsledok s ID, revíziami a zdrojmi." },
            400: { description: "Neplatný vstup." },
            401: { description: "Chýbajúce alebo odvolané prihlásenie." },
            403: { description: "Zápis nie je povolený." },
            404: { description: "Záznam neexistuje alebo nie je dostupný." },
            409: { description: "Konflikt revízie alebo idempotency key." },
          },
        },
      },
    ]),
  );
  return Response.json(
    {
      openapi: "3.1.0",
      info: { title: "BendaLabs Workspace API", version: "1.0.0" },
      servers: [{ url: origin() }],
      paths,
      components: {
        securitySchemes: {
          oauth: {
            type: "oauth2",
            flows: {
              authorizationCode: {
                authorizationUrl: `${origin()}/workspace/oauth/authorize`,
                tokenUrl: `${origin()}/workspace/oauth/token`,
                scopes: {
                  "workspace:read": "Čítanie povolených projektov",
                  "workspace:write": "Zápis v povolených projektoch",
                },
              },
            },
          },
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
