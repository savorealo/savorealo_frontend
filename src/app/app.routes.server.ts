import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Definición de las rutas del lado del servidor de Angular SSR.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth',
    renderMode: RenderMode.Server
  },
  {
    path: 'admin',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];