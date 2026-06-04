---
name: project-overview
description: Savorealo TFG — Angular 21 food social network app, stack and architecture overview
metadata:
  type: project
---

Savorealo es una red social gastronómica (TFG). Angular 21 zoneless + SSR, Supabase (auth/realtime), GraphQL/Apollo para posts y perfiles, PrimeNG 21 (Aura preset customizado) + Tailwind CSS 3.

**Why:** TFG del usuario, rama principal `main`, deploy en Cloudflare Pages.

**How to apply:** Al tocar cualquier archivo, respetar la arquitectura de repositorios por token (nunca inyectar la clase concreta), usar los tokens de diseño de `tokens.css` en lugar de colores Tailwind hardcoded, y añadir claves a los 14 idiomas en `translation.service.ts` al agregar texto de UI.

El diseño token system usa clases como `bg-surface`, `text-on-surface`, `bg-primary-container`, `text-on-primary-container` etc. mapeadas en `tailwind.config.js` a variables CSS de `tokens.css`.
