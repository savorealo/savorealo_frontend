import { ApplicationConfig, isDevMode } from '@angular/core'
import { provideZonelessChangeDetection } from '@angular/core'
import { provideServiceWorker } from '@angular/service-worker'
import { provideRouter, withViewTransitions, withComponentInputBinding } from '@angular/router'
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http'
import { provideClientHydration, withEventReplay } from '@angular/platform-browser'
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { providePrimeNG } from 'primeng/config'
import { MessageService } from 'primeng/api'
import { definePreset } from '@primeng/themes'
import Aura from '@primeng/themes/aura'

import { routes } from './app.routes'
import { authInterceptor } from '@core/interceptors/auth.interceptor'
import { ENVIRONMENT } from '@core/tokens/environment.token'
import { environment } from '../environments/environment'
import { provideApollo } from 'apollo-angular'
import { apolloOptionsFactory } from '@core/services/apollo.provider'

const SocialPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
  },
})

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: SocialPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          //cssLayer: { name: 'primeng', order: 'base, primeng, theme, utilities' },
        },
      },
      ripple: true,
    }),
    MessageService,
    { provide: ENVIRONMENT, useValue: environment },
    provideApollo(apolloOptionsFactory),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
}
