import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Savorealo');

  constructor() {
    // Bootstrap del ThemeService al arrancar la app (lee localStorage
    // y suscribe el listener de `prefers-color-scheme`).
    inject(ThemeService);
  }
}
