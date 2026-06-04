---
name: project-ui-improvements
description: Active UI improvement work on branch mejoras-ui — calls, palette, components
metadata:
  type: project
---

Rama `mejoras-ui` acumula mejoras de UI sobre `main`. Trabajo realizado hasta 2026-06-04:

**Videollamadas/llamadas (`call-overlay`):**
- Botón altavoz funcional: `toggleSpeaker()` en `CallService` + `CallStore` (mute/unmute remote audio track). Estado `isSpeakerOff` con visual rojo igual que mic/camera.
- ICE failure detection: signal `iceFailed` en `CallStore`, callback `onIceStateChange` en `createPeerConnection`. Mensaje de error "Sin conexión · pulsa colgar y vuelve a llamar".
- Responsive sizing: botones `size-12 sm:size-14`, `safe-area-inset-bottom` en barra de controles.

**ShareModal consolidado:**
- `SharePostModal` + `ShareProfileModal` → nuevo `ShareModal` en `messages/components/share-modal/`.
- Actualizado en `feed-page`, `profile`, `public-profile-page`.

**App shell:**
- Eliminado botón de búsqueda fake de la sidebar (búsqueda accesible vía ⌘K y ruta `/explore`).
- Limpiado import/inject de `GlobalSearchStore` que quedó huérfano.

**Settings page:**
- Icono "Soporte": `bg-orange-100 text-orange-700` → `bg-primary-container text-on-primary-container`.
- Error state del ticket: `text-red-600` → `text-error` (token del design system).

**Paleta de colores modo claro (`tokens.css`):**
- Neutros cálidos: surface=crema, cards=blanco, sidebar=beige (vs grises azulados anteriores).
- Primary container = cream official `#FFF4EB`, on-primary-container = `#3D1500` (WCAG AAA 14:1).

**Why:** Trabajo de TFG del usuario, presentación próxima.
**How to apply:** Continuar usando tokens del design system, no hardcodear colores Tailwind (excepto semánticos: green=vegano, red=error). Respetar patrón de botones de llamada: `bg-white/10` normal, `bg-red-500` cuando activo/muted.
