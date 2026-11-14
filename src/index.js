export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname === "/" ? "/index.html" : url.pathname;
    try {
      return await env.ASSETS.fetch(new Request("https://x" + path, request));
    } catch {
      return new Response("Not found", { status: 404 });
    }
  }
};
