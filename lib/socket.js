// WebSocket client for talking to the backend.
//
// Message protocol (JSON):
//   client -> server  request:  { id, type, payload }
//   server -> client  response: { id, ok: true, data } | { id, ok: false, error }
//   server -> client  event:    { type, payload }   (no id; pushed by the server)
//
// Usage:
//   import { socket } from "@/lib/socket";
//   socket.connect();
//   const players = await socket.request("getPlayers", { team: "NYY" });
//   const off = socket.on("draftPick", (payload) => { ... });

const DEFAULT_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_DELAY_MS = 10_000;

class Socket {
  constructor(url = DEFAULT_URL) {
    this.url = url;
    this.ws = null;
    this.status = "closed"; // "connecting" | "open" | "closed"
    this.nextId = 1;
    this.pending = new Map(); // id -> { resolve, reject, timer }
    this.listeners = new Map(); // type -> Set<fn>
    this.queue = []; // messages sent before the socket opened
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.shouldReconnect = false;
  }

  connect() {
    if (typeof window === "undefined") return; // no-op during SSR
    if (this.ws && this.status !== "closed") return;

    this.shouldReconnect = true;
    this.setStatus("connecting");
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setStatus("open");
      for (const msg of this.queue) this.ws.send(msg);
      this.queue = [];
    };

    this.ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        console.warn("[socket] non-JSON message:", event.data);
        return;
      }

      if (msg.id != null && this.pending.has(msg.id)) {
        const { resolve, reject, timer } = this.pending.get(msg.id);
        clearTimeout(timer);
        this.pending.delete(msg.id);
        msg.ok ? resolve(msg.data) : reject(new Error(msg.error ?? "Request failed"));
        return;
      }

      if (msg.type) this.emit(msg.type, msg.payload);
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.setStatus("closed");
      if (this.shouldReconnect) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose fires right after, which handles reconnecting.
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
    for (const { reject, timer } of this.pending.values()) {
      clearTimeout(timer);
      reject(new Error("Socket disconnected"));
    }
    this.pending.clear();
    this.queue = [];
  }

  // Send a request and wait for the matching response.
  request(type, payload = {}, { timeout = REQUEST_TIMEOUT_MS } = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request "${type}" timed out`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.send({ id, type, payload });
    });
  }

  // Fire-and-forget message, no response expected.
  send(message) {
    const data = JSON.stringify(message);
    if (this.status === "open") this.ws.send(data);
    else this.queue.push(data);
  }

  // Subscribe to server-pushed events. Returns an unsubscribe function.
  on(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
    return () => this.listeners.get(type)?.delete(fn);
  }

  emit(type, payload) {
    this.listeners.get(type)?.forEach((fn) => fn(payload));
  }

  setStatus(status) {
    this.status = status;
    this.emit("status", status);
  }

  scheduleReconnect() {
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, MAX_RECONNECT_DELAY_MS);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}

// Shared instance for the whole app.
export const socket = new Socket();
