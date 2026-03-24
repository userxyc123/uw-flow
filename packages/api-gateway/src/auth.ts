import { Request, Response, NextFunction } from "express";

/**
 * UW NetID OAuth middleware (MVP stub).
 *
 * In production this would validate a JWT issued by UW's OAuth2/OIDC provider.
 * For the hackathon MVP we accept a Bearer token and extract the user_id from it,
 * or fall back to an "anonymous" identity so the app is usable without auth.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    // TODO: validate JWT signature against UW OIDC JWKS endpoint
    // For MVP: treat the token value as the user_id directly
    (req as Request & { userId: string }).userId = token || "anonymous";
  } else {
    (req as Request & { userId: string }).userId = "anonymous";
  }

  next();
}

/** Rate limiting state: IP -> [timestamp, ...] */
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_REQUESTS = 100;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

export function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const log = (rateLimitMap.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  log.push(now);
  rateLimitMap.set(ip, log);

  if (log.length > RATE_LIMIT_REQUESTS) {
    res.status(429).json({ error: "Too many requests" });
    return;
  }
  next();
}
