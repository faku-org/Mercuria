import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createYoga } from "graphql-yoga";
import { schema } from "./schema";

/** Build del frontend (web/dist). Si no existe, el servidor sirve solo la API. */
const RUTA_WEB = resolve(import.meta.dir, "../../web/dist");

/**
 * Devuelve un archivo del build, o 404. Bloquea cualquier ruta que se escape
 * de RUTA_WEB (path traversal).
 */
function archivo(rutaRelativa: string): Response {
  const limpia = rutaRelativa.replace(/^\/+/, "");
  const absoluta = resolve(RUTA_WEB, limpia);
  if (!absoluta.startsWith(RUTA_WEB) || !existsSync(absoluta)) {
    return new Response("No encontrado", { status: 404 });
  }
  return new Response(Bun.file(absoluta));
}

/**
 * API GraphQL (`/graphql`, con GraphiQL) + frontend estático en la raíz.
 * Un solo puerto sirve la UI y la API, así el proxy inverso no necesita
 * mapear dos upstreams.
 */
export function crearApp() {
  const yoga = createYoga({ schema, graphiql: true, landingPage: true });
  const hayBuild = existsSync(RUTA_WEB);

  const app = new Elysia()
    .use(cors())
    .onError(({ code, error }) => ({ error: (error as Error).message, code }))
    .get("/api/salud", () => ({ ok: true, servicio: "polimorfismo-graphql", web: hayBuild }))
    .all("/graphql", ({ request }) => yoga.fetch(request));

  if (hayBuild) {
    app
      .get("/", () => archivo("index.html"))
      .get("/assets/*", ({ request }) => archivo(new URL(request.url).pathname))
      .get("/favicon.ico", () => archivo("favicon.ico"));
  }

  return app;
}
