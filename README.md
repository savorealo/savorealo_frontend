# Savorealo — Frontend

Aplicación Angular 21 de recetas y gastronomía social con soporte completo de internacionalización estática y traducción de contenido dinámico.

> Parte del proyecto **Savorealo**. Ver también:
> [Repositorio principal](https://github.com/savorealo/savorealo) ·
> [Backend (API GraphQL)](https://github.com/savorealo/api) ·
> [Mobile Android](https://github.com/acanojiDev/TFG-LET-ME-COOK-MOBILE) ·
> [Documentación técnica](https://github.com/savorealo/savorealo/blob/main/docs/confluence/01-frontend.md) ·
> [Compodoc (API docs)](https://savorealo.github.io/compodoc/) · [Repositorio Compodoc](https://github.com/savorealo/compodoc)

---

## Desarrollo

```bash
npm start          # Servidor de desarrollo → http://localhost:4200
npm run build      # Build de producción
ng build --configuration development  # Build de desarrollo
npm run docs       # Genera y sirve la documentación con Compodoc
```

La documentación generada está publicada en **[savorealo.github.io/compodoc/](https://savorealo.github.io/compodoc/)**.
Código fuente del site de documentación: [github.com/savorealo/compodoc](https://github.com/savorealo/compodoc).

---

## Internacionalización (i18n)

### Sistema de traducción de UI

La interfaz está completamente traducida a **14 idiomas** mediante `TranslationService`, ubicado en `src/app/core/services/translation.service.ts`. Todas las cadenas estáticas viven en ese archivo como constantes TypeScript — sin ficheros JSON externos ni dependencias de terceros.

#### Idiomas soportados

| Código | Idioma | Regiones del selector |
|--------|--------|-----------------------|
| `es` | Español | España 🇪🇸, México 🇲🇽 |
| `en` | English | Estados Unidos 🇺🇸, Reino Unido 🇬🇧, Canadá 🇨🇦, Australia 🇦🇺, Singapur 🇸🇬 |
| `fr` | Français | Francia 🇫🇷, Suiza 🇨🇭 |
| `de` | Deutsch | Alemania 🇩🇪, Suiza 🇨🇭 |
| `it` | Italiano | Italia 🇮🇹 |
| `pt-BR` | Português | Brasil 🇧🇷 |
| `nl` | Nederlands | Países Bajos 🇳🇱 |
| `sv` | Svenska | Suecia 🇸🇪 |
| `no` | Norsk | Noruega 🇳🇴 |
| `ja` | 日本語 | Japón 🇯🇵 |
| `ko` | 한국어 | Corea del Sur 🇰🇷 |
| `ar` | العربية | Emiratos Árabes Unidos 🇦🇪 |
| `hi` | हिन्दी | India 🇮🇳 |
| `id` | Bahasa Indonesia | Indonesia 🇮🇩 |

#### Cómo usar TranslationService

```typescript
// En un componente
private readonly translationService = inject(TranslationService)

// Leer el idioma activo (Signal reactivo)
this.translationService.currentLang()  // → 'es' | 'en' | 'ja' | ...

// Cambiar el idioma (persiste en localStorage)
this.translationService.setLanguage('ja')

// Traducir una clave programáticamente
this.translationService.translate('auth.login_btn')  // → 'ログイン'
```

```html
<!-- En templates — usando TranslatePipe -->
{{ 'shell.explore' | translate }}
{{ 'auth.register.create_btn' | translate }}
{{ (isActive ? 'actions.active' : 'actions.inactive') | translate }}
```

#### Persistencia del idioma

El idioma seleccionado se guarda en `localStorage` con la clave `savorealo_lang` y se restaura automáticamente al recargar la app.

#### Selector de idioma

- **Registro** (`/auth`): dropdown PrimeNG con las 20 regiones y sus banderas. Al cambiar la región, el idioma de la app cambia al instante.
- **Ajustes** (`/settings`): cuadrícula de botones con los 14 idiomas; el activo aparece resaltado con el color primario.

#### Añadir nuevas claves de traducción

1. Localiza la sección correspondiente en `translation.service.ts`.
2. Añade la clave en los **14 bloques de idioma** (uno por código):

```typescript
// Bloque 'es':
'mi_seccion.mi_clave': 'Texto en español',

// Bloque 'en':
'mi_seccion.mi_clave': 'Text in English',

// ... idem para fr, de, it, pt-BR, nl, sv, no, ja, ko, ar, hi, id
```

---

## Traducción de contenido dinámico

Las descripciones de posts y los mensajes de chat son texto libre de usuarios, imposible de pre-traducir. Para ello existe el **`ContentTranslationService`**.

### API: MyMemory Translated

Se usa la [API pública de MyMemory](https://mymemory.translated.net/) — gratuita, sin API key, sin configuración de entorno.

```
GET https://api.mymemory.translated.net/get?q=TEXTO&langpair=auto|TARGET_LANG
```

- **Sin clave**: la URL es completamente pública.
- **Detección automática** del idioma origen con `langpair=auto|TARGET`.
- **Límite gratuito**: 5.000 palabras/día por IP (suficiente para uso social típico).
- **Todos los idiomas** del sistema están soportados.
- **Escalable**: si se requiere mayor volumen, basta con mover la lógica a una Supabase Edge Function sin cambiar la interfaz del servicio.

### ContentTranslationService

**Archivo**: `src/app/core/services/content-translation.service.ts`

```typescript
private readonly contentTranslation = inject(ContentTranslationService)

// Traduce al idioma activo configurado en la app
this.contentTranslation.translate('Ciao mondo')
  .subscribe(result => console.log(result))
  // → 'Hello world'  (si currentLang = 'en')
  // → 'こんにちは世界' (si currentLang = 'ja')
```

El idioma destino se lee automáticamente de `TranslationService.currentLang()` en el momento de la llamada.

#### Caché en memoria

Para evitar llamadas de red repetidas, el servicio mantiene un `Map<string, string>` con la clave `"${targetLang}::${texto}"`. La segunda vez que se traduce el mismo texto al mismo idioma, la respuesta es inmediata sin petición HTTP.

### Botón Traducir / Original

El botón está integrado en tres lugares:

#### 1. Tarjetas de post — `PostCard`

Aparece un enlace con el icono `pi-language` y el texto **Traducir** justo debajo de la descripción de cada post en el feed y en Explorar.

```
[🌐 Traducir]   →   texto cambia al idioma activo
[🌐 Original]   →   texto vuelve al idioma original
```

- El estado es **por tarjeta** — traducir un post no afecta al resto.
- La segunda traducción del mismo post es instantánea (caché).
- Si la API falla, aparece el mensaje de error localizado (`translate.error`).

#### 2. Detalle del post — `PostDetailPage`

Mismo comportamiento bajo la descripción completa del post (`post.description`).  
La descripción estructurada de la receta (`recipe.description`) **no** se traduce — es contenido técnico, no texto libre.

#### 3. Mensajes de chat — `MessageBubble`

Aparece un botón con el icono `pi-language` al hacer **hover** sobre la burbuja del mensaje, junto al botón de responder. Solo se muestra en burbujas con texto puro (no en mensajes con posts o perfiles compartidos).

- El estado de traducción es **por burbuja** e independiente para cada mensaje.
- Al recargar o cerrar la conversación, las traducciones se descartan.

### Soporte RTL (árabe)

Cuando el idioma activo es `ar` y el contenido está traducido, el contenedor del texto recibe automáticamente `dir="rtl"` para que fluya de derecha a izquierda. Al volver al original, el atributo se elimina sin afectar al resto del layout.

---

## Estructura de archivos relevantes

```
src/app/core/services/
├── translation.service.ts           # i18n estática: 14 idiomas, ~8500 líneas
│   ├── LanguageCode                 # Tipo union con 14 códigos
│   ├── LOCALE_OPTIONS               # 20 regiones → LanguageCode (para el registro)
│   ├── LANGUAGE_OPTIONS             # 14 idiomas únicos (para ajustes)
│   └── TranslationService           # currentLang signal + setLanguage() + translate()
└── content-translation.service.ts   # Traducción dinámica vía MyMemory
    └── ContentTranslationService    # translate(text): Observable<string> + caché

src/app/shared/
├── components/post-card/
│   ├── post-card.ts                 # translatedContent, translateLoading, triggerTranslate()
│   └── post-card.html               # Botón Traducir/Original bajo descripción
└── pipes/
    └── translate.pipe.ts            # Pipe impura reactiva al signal currentLang

src/app/features/
├── post-detail/
│   ├── post-detail-page.ts          # translatedDescription, triggerTranslate()
│   └── post-detail-page.html        # Botón bajo post.description
├── auth/register/
│   ├── register.ts                  # localeOptions, selectedLocale, changeLocale()
│   └── register.html                # p-select con 20 regiones y banderas
├── settings/
│   ├── settings-page.ts             # languageOptions = LANGUAGE_OPTIONS
│   └── settings-page.html           # Cuadrícula dinámica de 14 idiomas
└── messages/components/message-bubble/
    ├── message-bubble.ts            # translatedText, translationDir (RTL), triggerTranslate()
    └── message-bubble.html          # Icono pi-language al hover + dir="rtl" para árabe
```

---

## Angular CLI

```bash
ng generate component nombre   # Generar componente
ng build                       # Build producción
ng test                        # Tests con Vitest
ng e2e                         # Tests E2E
```

Documentación Angular CLI: https://angular.dev/tools/cli
