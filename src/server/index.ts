// Servidor HTTP que expone el dominio vía GraphQL.
// Uso: `bun run serve`  → http://localhost:3011/graphql
//
// `reusePort: false` es a propósito: Bun comparte el puerto entre procesos por
// defecto (SO_REUSEPORT), y eso hace que dos instancias se repartan las
// requests sin que ninguna falle. Preferimos que la segunda muera con
// EADDRINUSE y no convivan dos mundos distintos.

import { crearApp } from "./app";

const PORT = Number(process.env.PORT ?? 3011);
const HOST = process.env.HOST ?? "127.0.0.1";

const app = crearApp();

// Bind solo a loopback: la exposición (tailnet o nginx) la hace el proxy.
app.listen({ port: PORT, hostname: HOST, reusePort: false });

console.log(`Polimorfismo (GraphQL + UI) en http://${HOST}:${PORT}/`);
