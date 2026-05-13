import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SpotlightBg } from "@shared/components/spotlight/spotlightBg";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SpotlightBg],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('cookeealo');
}
