import { AngularAppEngine } from '@angular/ssr';

/**
 * Instancia del motor de renderizado SSR de Angular para entornos Cloudflare.
 */
const angularApp = new AngularAppEngine();

/**
 * Interfaz que define las variables de entorno y recursos disponibles en Cloudflare Workers/Pages.
 */
interface CloudflareEnv {
  /**
   * Binding de activos estáticos de Cloudflare Pages para recuperar y servir archivos estáticos.
   */
  ASSETS: { /**
   * Método para fetch.
   */
  fetch(request: Request): Promise<Response> };
}

const API_WORKER_URL = 'https://savorealo-api.savorealo.workers.dev';

/**
 * Cloudflare Pages SSR entry point.
 * This file is used ONLY for Cloudflare Pages deployments.
 * For local development, use server.ts (Node.js/Express).
 */
export default {
  async fetch(request: Request, env: CloudflareEnv): Promise<Response> {
    /**
     * Variable o constante para { pathname }.
     */
    const { pathname } = new URL(request.url);

    // Proxy /api/* to the backend Cloudflare Worker.
    if (pathname.startsWith('/api')) {
      const backendUrl = new URL(request.url);
      backendUrl.hostname = new URL(API_WORKER_URL).hostname;
      backendUrl.protocol = 'https:';
      backendUrl.port = '';
      return fetch(new Request(backendUrl.toString(), request));
    }

    // Static assets (JS, CSS, images, fonts, manifests, etc.) go directly
    // to the Cloudflare Pages ASSETS binding — Angular never sees them.
    if (/\.[^/]+$/.test(pathname)) {
      return env.ASSETS.fetch(request);
    }

    // All other requests (app routes) go through Angular SSR.
    /**
     * Variable o constante para response.
     */
    const response = await angularApp.handle(request);

    // If Angular can't handle it (e.g. unknown route with no fallback),
    // let ASSETS try — it will return a 404 from Pages.
    return response ?? env.ASSETS.fetch(request);
  },
};
