export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/feedback" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ ok: false, error: "invalid json" }), { status: 400, headers: { "content-type": "application/json" } });
      }
      const message = String(body && body.message ? body.message : "").trim();
      if (!message) {
        return new Response(JSON.stringify({ ok: false, error: "empty" }), { status: 400, headers: { "content-type": "application/json" } });
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const record = { id, message, createdAt: new Date().toISOString(), userAgent: request.headers.get("user-agent") || "" };
      await env.FEEDBACK.put(`feedback:${id}`, JSON.stringify(record));
      return new Response(JSON.stringify({ ok: true, id }), { status: 200, headers: { "content-type": "application/json" } });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch {
        return new Response(JSON.stringify({ ok: false, error: "invalid json" }), { status: 400, headers: { "content-type": "application/json" } });
      }
      const messages = Array.isArray(body && body.messages) ? body.messages : [];
      if (!messages.length) {
        return new Response(JSON.stringify({ ok: false, error: "empty" }), { status: 400, headers: { "content-type": "application/json" } });
      }
      try {
        const apiKey = env.AI;
        if (!apiKey) return new Response(JSON.stringify({ ok:false, error:"missing secret AI" }), { status: 500, headers: { "content-type": "application/json" } });
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": "Bearer " + apiKey,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-20b",
            messages,
            temperature: 0.7,
          }),
        });
        const data = await groqRes.json();
        if (!groqRes.ok) {
          return new Response(JSON.stringify({ ok: false, error: (data && data.error && data.error.message) || groqRes.statusText }), { status: 500, headers: { "content-type": "application/json" } });
        }
        const reply = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
        return new Response(JSON.stringify({ ok: true, reply: String(reply) }), { status: 200, headers: { "content-type": "application/json" } });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: String(e && e.message ? e.message : e) }), { status: 500, headers: { "content-type": "application/json" } });
      }
    }

    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    try {
      return await env.ASSETS.fetch(new Request("https://x" + path, request));
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
};
