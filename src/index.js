export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/feedback" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      const message = String(body && body.message ? body.message : "").trim();
      if (!message) {
        return new Response(JSON.stringify({ ok: false, error: "empty" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const record = {
        id,
        message,
        createdAt: new Date().toISOString(),
        userAgent: request.headers.get("user-agent") || "",
      };
      await env.FEEDBACK.put(`feedback:${id}`, JSON.stringify(record));
      return new Response(JSON.stringify({ ok: true, id }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    try {
      return await env.ASSETS.fetch(new Request("https://x" + path, request));
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
};
