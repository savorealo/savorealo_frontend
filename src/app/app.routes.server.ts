import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'auth',       // ← solo SSR en la página de login
    renderMode: RenderMode.Server
  },
  {
    path: '**',         // ← todo lo demás en el cliente
    renderMode: RenderMode.Client
  }
];