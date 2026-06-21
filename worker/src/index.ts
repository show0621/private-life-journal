export interface Env {
  VAULT: KVNamespace;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Sync-Key",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isValidSyncKey(key: string | null): key is string {
  return !!key && /^[a-f0-9]{64}$/.test(key);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true });
    }

    if (url.pathname !== "/vault") {
      return json({ error: "not found" }, 404);
    }

    const syncKey = request.headers.get("X-Sync-Key");
    if (!isValidSyncKey(syncKey)) {
      return json({ error: "invalid sync key" }, 400);
    }

    const kvKey = `vault:${syncKey}`;

    if (request.method === "GET") {
      const record = await env.VAULT.get(kvKey);
      if (!record) return json({ error: "not found" }, 404);
      return new Response(record, {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (request.method === "PUT") {
      const body = await request.text();
      if (!body) return json({ error: "empty body" }, 400);
      try {
        JSON.parse(body);
      } catch {
        return json({ error: "invalid json" }, 400);
      }
      await env.VAULT.put(kvKey, body);
      return json({ ok: true });
    }

    return json({ error: "method not allowed" }, 405);
  },
};
