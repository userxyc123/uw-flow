import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import type { SmartRoute } from "@uw-flow/shared-types";

let _wss: WebSocketServer | null = null;

/** Attach WebSocket server for live route updates */
export function attachRoutesWebSocket(server: Server): WebSocketServer {
  _wss = new WebSocketServer({ server, path: "/ws/routes/live" });

  _wss.on("connection", (ws) => {
    ws.on("error", (err) => console.error("[routes ws] client error:", err));
  });

  return _wss;
}

/** Push updated routes to all connected clients when conditions change */
export function broadcastRouteUpdate(routes: SmartRoute[]): void {
  if (!_wss) return;
  const payload = JSON.stringify({ type: "route_update", routes, timestamp: new Date().toISOString() });
  for (const client of _wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
