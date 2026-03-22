import { ApplicationConfig} from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  provideRouter, withViewTransitions,
  withComponentInputBinding
} from '@angular/router';
import {
  provideHttpClient, withFetch,
  withInterceptors
} from '@angular/common/http';
import {
  provideClientHydration,
  withEventReplay
} from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';

const SocialPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
      300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6',
      600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a',
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideHttpClient(withFetch(), withInterceptors([])),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: SocialPreset,
        options: {
          darkModeSelector: '[data-theme="dark"]',
          cssLayer: { name: 'primeng', order: 'base, primeng, theme, utilities' },
        },
      },
      ripple: true,
    }),
  ],
};
