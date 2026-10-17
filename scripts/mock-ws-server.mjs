// Stand-in for the real backend while it's being built.
// Run with: npm run mock-ws
// Speaks the same protocol as lib/socket.js.

import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT ?? 8080);

// Replace these with real SQLite queries on the backend.
const handlers = {
  ping: () => "pong",
  echo: (payload) => payload,
};

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws) => {
  console.log("client connected");
  ws.send(JSON.stringify({ type: "welcome", payload: { message: "Connected to mock server" } }));

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    console.log("<-", msg);

    if (msg.id == null) return; // fire-and-forget message

    const handler = handlers[msg.type];
    const response = handler
      ? { id: msg.id, ok: true, data: await handler(msg.payload) }
      : { id: msg.id, ok: false, error: `Unknown request type "${msg.type}"` };
    ws.send(JSON.stringify(response));
  });

  ws.on("close", () => console.log("client disconnected"));
});

console.log(`Mock WebSocket server listening on ws://localhost:${PORT}`);
