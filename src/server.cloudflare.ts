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
    const response = await angularApp.handle(request);
    return response ?? env.ASSETS.fetch(request);
  },
};
