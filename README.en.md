# Savorealo — Frontend

Angular 21 recipes and social gastronomy application with full support for static internationalisation and dynamic content translation.

> Part of the **Savorealo** project. See also:
> [Main repository](https://github.com/savorealo/savorealo) ·
> [Backend (GraphQL API)](https://github.com/savorealo/api) ·
> [Android Mobile](https://github.com/acanojiDev/TFG-LET-ME-COOK-MOBILE) ·
> [Technical docs](https://github.com/savorealo/savorealo/blob/main/docs/confluence/01-frontend.md) ·
> [Compodoc (API docs)](https://savorealo.github.io/compodoc/) · [Compodoc repository](https://github.com/savorealo/compodoc)

---

## Development

```bash
npm start          # Dev server → http://localhost:4200
npm run build      # Production build
ng build --configuration development  # Development build
npm run docs       # Generate and serve documentation with Compodoc
```

The generated documentation is published at **[savorealo.github.io/compodoc/](https://savorealo.github.io/compodoc/)**.
Documentation site source code: [github.com/savorealo/compodoc](https://github.com/savorealo/compodoc).

---

## Internationalisation (i18n)

### UI translation system

The interface is fully translated into **14 languages** via `TranslationService`, located at `src/app/core/services/translation.service.ts`. All static strings live in that file as TypeScript constants — no external JSON files, no third-party dependencies.

#### Supported languages

| Code | Language | Selector regions |
|------|----------|------------------|
| `es` | Español | Spain 🇪🇸, Mexico 🇲🇽 |
| `en` | English | United States 🇺🇸, United Kingdom 🇬🇧, Canada 🇨🇦, Australia 🇦🇺, Singapore 🇸🇬 |
| `fr` | Français | France 🇫🇷, Switzerland 🇨🇭 |
| `de` | Deutsch | Germany 🇩🇪, Switzerland 🇨🇭 |
| `it` | Italiano | Italy 🇮🇹 |
| `pt-BR` | Português | Brazil 🇧🇷 |
| `nl` | Nederlands | Netherlands 🇳🇱 |
| `sv` | Svenska | Sweden 🇸🇪 |
| `no` | Norsk | Norway 🇳🇴 |
| `ja` | 日本語 | Japan 🇯🇵 |
| `ko` | 한국어 | South Korea 🇰🇷 |
| `ar` | العربية | United Arab Emirates 🇦🇪 |
| `hi` | हिन्दी | India 🇮🇳 |
| `id` | Bahasa Indonesia | Indonesia 🇮🇩 |

#### How to use TranslationService

```typescript
// In a component
private readonly translationService = inject(TranslationService)

// Read the active language (reactive Signal)
this.translationService.currentLang()  // → 'es' | 'en' | 'ja' | ...

// Change the language (persisted in localStorage)
this.translationService.setLanguage('ja')

// Translate a key programmatically
this.translationService.translate('auth.login_btn')  // → 'ログイン'
```

```html
<!-- In templates — using TranslatePipe -->
{{ 'shell.explore' | translate }}
{{ 'auth.register.create_btn' | translate }}
{{ (isActive ? 'actions.active' : 'actions.inactive') | translate }}
```

#### Language persistence

The selected language is stored in `localStorage` under the key `savorealo_lang` and automatically restored on app reload.

#### Language selector

- **Register** (`/auth`): PrimeNG dropdown with 20 regions and their flags. Changing the region instantly updates the app language.
- **Settings** (`/settings`): button grid with all 14 languages; the active one is highlighted with the primary colour.

#### Adding new translation keys

1. Locate the relevant section in `translation.service.ts`.
2. Add the key to **all 14 language blocks** (one per code):

```typescript
// 'es' block:
'my_section.my_key': 'Texto en español',

// 'en' block:
'my_section.my_key': 'Text in English',

// ... same for fr, de, it, pt-BR, nl, sv, no, ja, ko, ar, hi, id
```

---

## Dynamic content translation

Post descriptions and chat messages are free-form user text that cannot be pre-translated. For this, **`ContentTranslationService`** exists.

### API: MyMemory Translated

Uses the [MyMemory public API](https://mymemory.translated.net/) — free, no API key, no environment setup required.

```
GET https://api.mymemory.translated.net/get?q=TEXT&langpair=auto|TARGET_LANG
```

- **No key required**: the URL is fully public.
- **Automatic source language detection** via `langpair=auto|TARGET`.
- **Free tier limit**: 5,000 words/day per IP (sufficient for typical social usage).
- **All system languages** are supported.
- **Scalable**: if higher volume is needed, simply move the logic to a Supabase Edge Function without changing the service interface.

### ContentTranslationService

**File**: `src/app/core/services/content-translation.service.ts`

```typescript
private readonly contentTranslation = inject(ContentTranslationService)

// Translates to the active language configured in the app
this.contentTranslation.translate('Ciao mondo')
  .subscribe(result => console.log(result))
  // → 'Hello world'  (if currentLang = 'en')
  // → 'こんにちは世界' (if currentLang = 'ja')
```

The target language is read automatically from `TranslationService.currentLang()` at call time.

#### In-memory cache

To avoid repeated network calls, the service maintains a `Map<string, string>` keyed by `"${targetLang}::${text}"`. The second time the same text is translated into the same language, the response is instant with no HTTP request.

### Translate / Original button

The button is integrated in three places:

#### 1. Post cards — `PostCard`

A link with the `pi-language` icon and the text **Translate** appears just below the post description in the feed and in Explore.

```
[🌐 Translate]   →   text switches to the active language
[🌐 Original]    →   text reverts to the original language
```

- State is **per card** — translating one post does not affect others.
- A second translation of the same post is instant (cache).
- If the API fails, the localised error message is shown (`translate.error`).

#### 2. Post detail — `PostDetailPage`

Same behaviour below the full post description (`post.description`).  
The structured recipe description (`recipe.description`) is **not** translated — it is technical content, not free-form text.

#### 3. Chat messages — `MessageBubble`

A button with the `pi-language` icon appears on **hover** over the message bubble, next to the reply button. It is only shown on plain-text bubbles (not on messages containing shared posts or profiles).

- Translation state is **per bubble** and independent for each message.
- On conversation reload or close, translations are discarded.

### RTL support (Arabic)

When the active language is `ar` and content is translated, the text container automatically receives `dir="rtl"` so it flows right-to-left. Switching back to the original removes the attribute without affecting the rest of the layout.

---

## Relevant file structure

```
src/app/core/services/
├── translation.service.ts           # Static i18n: 14 languages, ~8500 lines
│   ├── LanguageCode                 # Union type with 14 codes
│   ├── LOCALE_OPTIONS               # 20 regions → LanguageCode (for registration)
│   ├── LANGUAGE_OPTIONS             # 14 unique languages (for settings)
│   └── TranslationService           # currentLang signal + setLanguage() + translate()
└── content-translation.service.ts   # Dynamic translation via MyMemory
    └── ContentTranslationService    # translate(text): Observable<string> + cache

src/app/shared/
├── components/post-card/
│   ├── post-card.ts                 # translatedContent, translateLoading, triggerTranslate()
│   └── post-card.html               # Translate/Original button below description
└── pipes/
    └── translate.pipe.ts            # Impure pipe reactive to currentLang signal

src/app/features/
├── post-detail/
│   ├── post-detail-page.ts          # translatedDescription, triggerTranslate()
│   └── post-detail-page.html        # Button below post.description
├── auth/register/
│   ├── register.ts                  # localeOptions, selectedLocale, changeLocale()
│   └── register.html                # p-select with 20 regions and flags
├── settings/
│   ├── settings-page.ts             # languageOptions = LANGUAGE_OPTIONS
│   └── settings-page.html           # Dynamic grid of 14 languages
└── messages/components/message-bubble/
    ├── message-bubble.ts            # translatedText, translationDir (RTL), triggerTranslate()
    └── message-bubble.html          # pi-language icon on hover + dir="rtl" for Arabic
```

---

## Angular CLI

```bash
ng generate component name   # Generate component
ng build                     # Production build
ng test                      # Tests with Vitest
ng e2e                       # E2E tests
```

Angular CLI docs: https://angular.dev/tools/cli
