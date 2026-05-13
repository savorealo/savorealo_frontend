import { AngularAppEngine } from '@angular/ssr';

const angularApp = new AngularAppEngine();

interface CloudflareEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

/**
 * Cloudflare Pages SSR entry point.
 * This file is used ONLY for Cloudflare Pages deployments.
 * For local development, use server.ts (Node.js/Express).
 */
export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    const { pathname } = new URL(request.url);

    // Static assets (JS, CSS, images, fonts, manifests, etc.) go directly
    // to the Cloudflare Pages ASSETS binding — Angular never sees them.
    if (/\.[^/]+$/.test(pathname)) {
      return env.ASSETS.fetch(request);
    }

    // All other requests (app routes) go through Angular SSR.
    const response = await angularApp.handle(request);

    // If Angular can't handle it (e.g. unknown route with no fallback),
    // let ASSETS try — it will return a 404 from Pages.
    return response ?? env.ASSETS.fetch(request);
  },
};
