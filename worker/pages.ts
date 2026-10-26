type PagesBindings = {
  APP_ORIGIN: string;
  BACKEND: Fetcher;
  ASSETS: Fetcher;
};

/** Serve Pages assets and forward same-origin API requests without replay. */
const pages = {
  async fetch(request: Request, env: PagesBindings): Promise<Response> {
    const unavailable = (status: number, code: string) =>
      Response.json(
        { error: code },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    let origin: URL;
    try {
      origin = new URL(env.APP_ORIGIN);
      if (
        origin.protocol !== "https:" ||
        origin.origin !== env.APP_ORIGIN ||
        origin.username ||
        origin.password
      )
        return unavailable(503, "environment_unavailable");
    } catch {
      return unavailable(503, "environment_unavailable");
    }
    const url = new URL(request.url);
    if (url.origin !== origin.origin) return unavailable(403, "origin_denied");
    if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
      if (
        request.headers.has("origin") &&
        request.headers.get("origin") !== origin.origin
      )
        return unavailable(403, "origin_denied");
      if (typeof env.BACKEND?.fetch !== "function")
        return unavailable(503, "environment_unavailable");
      try {
        // Preserve the public URL, cookies and raw webhook body. The backend
        // still authenticates requests; no caller-supplied header grants trust.
        // Never follow a checkout redirect or retry an uncertain provider write.
        const response = await env.BACKEND.fetch(
          new Request(request, { redirect: "manual" }),
        );
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "no-store");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch {
        return unavailable(502, "backend_unavailable");
      }
    }
    if (request.method !== "GET" && request.method !== "HEAD")
      return unavailable(405, "method_not_allowed");
    return env.ASSETS.fetch(request);
  },
};

export default pages;
