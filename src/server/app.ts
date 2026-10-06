import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createYoga } from "graphql-yoga";
import { suscribir } from "./eventos";
import { mundoDto } from "./mundo";
import { schema } from "./schema";

/** Build del frontend (web/dist). Si no existe, el servidor sirve solo la API. */
const RUTA_WEB = resolve(import.meta.dir, "../../web/dist");

/** Cada cuánto se manda un comentario de keep-alive por una conexión idle. */
const PING_MS = 15_000;

/**
 * Stream SSE con el estado del mundo. Manda un snapshot al conectar y otro cada
 * vez que el mundo cambia (tick del reloj o mutación), vía el bus de eventos.
 */
function streamMundo(signal: AbortSignal): Response {
  const codificador = new TextEncoder();
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controlador) {
        let cerrado = false;

        const enviar = (contenido: string) => {
          if (cerrado) return;
          try {
            controlador.enqueue(codificador.encode(contenido));
          } catch {
            // Conexión caída: el abort se encarga de limpiar.
          }
        };

        const enviarMundo = () => enviar(`data: ${JSON.stringify(mundoDto())}\n\n`);

        enviarMundo();
        const desuscribir = suscribir(enviarMundo);

        const ping = setInterval(() => enviar(": ping\n\n"), PING_MS);

        const terminar = () => {
          if (cerrado) return;
          cerrado = true;
          clearInterval(ping);
          desuscribir();
          try {
            controlador.close();
          } catch {
            // Ya cerrado.
          }
        };

        signal.addEventListener("abort", terminar, { once: true });
        if (signal.aborted) terminar();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    },
  );
}

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
/** Extrae el token de `Authorization: Bearer <token>`. */
function tokenDe(encabezado: string | null): string | null {
  if (!encabezado) return null;
  const [esquema, valor] = encabezado.split(" ");
  return esquema?.toLowerCase() === "bearer" && valor ? valor : null;
}

export function crearApp() {
  const yoga = createYoga({
    schema,
    graphiql: true,
    landingPage: true,
    context: ({ request }) => ({ token: tokenDe(request.headers.get("authorization")) }),
  });
  const hayBuild = existsSync(RUTA_WEB);

  const app = new Elysia()
    .use(cors())
    .onError(({ code, error }) => ({ error: (error as Error).message, code }))
    .get("/api/salud", () => ({ ok: true, servicio: "polimorfismo-graphql", web: hayBuild }))
    .get("/api/stream", ({ request }) => streamMundo(request.signal))
    .all("/graphql", ({ request }) => yoga.fetch(request));

  if (hayBuild) {
    app
      .get("/", () => archivo("index.html"))
      .get("/assets/*", ({ request }) => archivo(new URL(request.url).pathname))
      .get("/favicon.ico", () => archivo("favicon.ico"));
  }

  return app;
}
