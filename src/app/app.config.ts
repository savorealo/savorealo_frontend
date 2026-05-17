import { ApplicationConfig, isDevMode } from '@angular/core'
import { MessageService } from 'primeng/api'
import { provideZonelessChangeDetection } from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { providePrimeNG } from 'primeng/config'
import { definePreset } from '@primeng/themes'
import Aura from '@primeng/themes/aura'

import { routes } from './app.routes'
import { authInterceptor } from '@core/interceptors/auth.interceptor'
import { ENVIRONMENT } from '@core/tokens/environment.token'
import { environment } from '../environments/environment'
import { provideApollo } from 'apollo-angular'
import { apolloOptionsFactory } from '@core/services/apollo.provider'

/**
 * Preset PrimeNG alineado con la paleta oficial Savorealo.
 * El color base (#FFE777) se sitúa en 500, y el "en primario"
 * (#393000) cierra la escala en 900. Light/dark se controla
 * vía CSS variables en `src/styles/tokens.css` — esta escala
 * solo cubre los tokens que PrimeNG necesita para componentes
 * como p-button, p-tag, p-toast, etc.
 */
const SavorealoPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#fffdf0',
      100: '#fffbd9',
      200: '#fff5a3',
      300: '#ffef7d',
      400: '#ffeb60',
      500: '#ffe777',
      600: '#b89e00',
      700: '#826f00',
      800: '#5c4f00',
      900: '#393000',
    },
  },
})

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions({ skipInitialTransition: true }), withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: SavorealoPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
        },
      },
      ripple: true,
    }),
    MessageService,
    { provide: ENVIRONMENT, useValue: environment },
    MessageService,
    provideApollo(apolloOptionsFactory),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}
