import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser }                       from '@angular/common';
import { RouterOutlet }                            from '@angular/router';
import { ThemeService }                            from '@core/services/theme.service';
import { SupabaseService }                         from '@core/services/supabase.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Savorealo');

  constructor() {
    inject(ThemeService);

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      const auth = inject(SupabaseService).client.auth;
      // Arrancar el auto-refresh inmediatamente al montar la app
      auth.startAutoRefresh();
      // Pausar cuando la pestaña queda oculta; reactivar al volver al foco
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          auth.startAutoRefresh();
        } else {
          auth.stopAutoRefresh();
        }
      });
    }
  }
}
