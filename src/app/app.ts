import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Apollo, gql } from 'apollo-angular';
import { EmojiRain } from "@features/emoji-rain/emoji-rain";
import { CardModule, Card } from 'primeng/card';
import { Button, ButtonModule } from "primeng/button";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, EmojiRain, CardModule, Card, Button, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('cookeealo');
  private apollo = inject(Apollo)

  constructor() {
    this.apollo.query({
      query: gql`query { __typename }`
    }).subscribe({
      next: data => console.log('✓ Apollo conectado:', data),
      error: err => console.error('✗ Error Apollo:', err),
    })
  }
}
