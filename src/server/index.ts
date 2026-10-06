// Servidor HTTP que expone el dominio (y los fixtures) vía JSON.
// Uso: `bun run serve`  → http://localhost:3011

import { crearApp } from "./app";

const PORT = Number(process.env.PORT ?? 3011);

crearApp().listen(PORT);

console.log(`API Polimorfismo escuchando en http://localhost:${PORT}`);
