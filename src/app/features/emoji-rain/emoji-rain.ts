import { Component, OnInit } from '@angular/core'

/**
 * Clase de utilidad para emojirain.
 */
@Component({
  selector: 'app-emoji-rain',
  imports: [],
  templateUrl: './emoji-rain.html',
  styleUrl: './emoji-rain.scss',
})
export class EmojiRain implements OnInit {
  emojis: unknown = [];
  private emojiList = ['🍳', '🥐', '🧁', '🍓', '🥑', '🍅', '🍋', '🌿'];
  /**
   * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
   */
  ngOnInit(): void {
    this.emojis = Array.from({ length: 6 }, () => ({
      char: this.emojiList[Math.floor(Math.random() * this.emojiList.length)],
      left: `${Math.random() * 99}%`,
      duration: `${3 + Math.random() * 5}s`,
      delay: `-${Math.random() * 8}s`,
      size: `${1 + Math.random() * 3}rem`
    }));
  }

}
