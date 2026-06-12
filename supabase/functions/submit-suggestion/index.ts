// Kontinue? Games — submit-suggestion edge function
// Authless community SUGGESTION BOX intake, hardened like the score submitters (§4):
//   * strict shape validation (tag, category, body length)
//   * per-IP sha256 rate limit via the suggestion_submissions ledger
//   * service-role insert with approved=false (everything starts hidden, curated later)
//
// Deploy with the Supabase MCP `deploy_edge_function`, or:
//   supabase functions deploy submit-suggestion --no-verify-jwt --project-ref artypnnxsdovgmsznlbg
// (no-verify-jwt: the arcade is authless; the anon key is sent but we don't require a user)

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CATEGORIES = new Set(["GAME", "FEATURE", "FIX", "OTHER"]);
const RATE_LIMIT = 8;            // submissions allowed per IP per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const BODY_MIN = 4;
const BODY_MAX = 280;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let payload: { tag?: unknown; category?: unknown; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "bad json" }, 400);
  }

  // ---- validate body ----
  const body = typeof payload.body === "string" ? payload.body.trim().replace(/\s+/g, " ") : "";
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return json({ error: "body must be 4–280 characters" }, 400);
  }

  // ---- validate optional tag (arcade initials) ----
  let tag: string | null = null;
  if (typeof payload.tag === "string" && payload.tag.trim()) {
    const t = payload.tag.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(t)) return json({ error: "tag must be 3 letters A–Z" }, 400);
    tag = t;
  }

  // ---- validate category ----
  let category = "GAME";
  if (typeof payload.category === "string") {
    const c = payload.category.trim().toUpperCase();
    if (c) {
      if (!CATEGORIES.has(c)) return json({ error: "bad category" }, 400);
      category = c;
    }
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });

  // ---- per-IP rate limit ----
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "0.0.0.0";
  const ipHash = await sha256(ip + "|suggest");
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count } = await db
    .from("suggestion_submissions")
    .select("*", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if ((count ?? 0) >= RATE_LIMIT) {
    return json({ error: "Whoa, thanks for the ideas — try again in a bit." }, 429);
  }

  // ---- insert (hidden until approved) ----
  const { error } = await db.from("suggestions").insert({ tag, category, body, approved: false });
  if (error) return json({ error: "insert failed" }, 500);

  await db.from("suggestion_submissions").insert({ ip_hash: ipHash });

  return json({ ok: true });
});
