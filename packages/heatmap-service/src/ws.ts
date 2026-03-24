import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { getCurrentSnapshot, refreshSnapshot } from "./heatmap";

let _wss: WebSocketServer | null = null;

/** Broadcast the latest snapshot to all connected clients */
export function broadcastSnapshot(): void {
  if (!_wss) return;
  const snapshot = getCurrentSnapshot();
  const payload = JSON.stringify(snapshot);
  for (const client of _wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

/** Attach WebSocket server to an existing HTTP server */
export function attachWebSocket(server: Server): WebSocketServer {
  _wss = new WebSocketServer({ server, path: "/ws/heatmap" });

  _wss.on("connection", (ws) => {
    // On connect, immediately send a full snapshot (Requirement 4.2)
    ws.send(JSON.stringify(getCurrentSnapshot()));

    ws.on("error", (err) => {
      console.error("[heatmap ws] client error:", err);
    });
  });

  return _wss;
}

/** Push a fresh snapshot to all clients — called by the refresh cycle */
export function pushRefreshedSnapshot(): void {
  refreshSnapshot();
  broadcastSnapshot();
}
