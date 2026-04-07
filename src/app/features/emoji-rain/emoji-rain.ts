import { Component } from '@angular/core'

@Component({
  selector: 'app-emoji-rain',
  imports: [],
  templateUrl: './emoji-rain.html',
  styleUrl: './emoji-rain.scss',
})
export class EmojiRain {
  emojis: any = [];
  private emojiList = ['🍣', '🍱', '🥢', '🍙', '🍚', '🐟'];
  ngOnInit(): void {
    this.emojis = Array.from({ length: 5 }, () => ({
      char: this.emojiList[Math.floor(Math.random() * this.emojiList.length)],
      left: `${Math.random() * 99}%`,
      duration: `${3 + Math.random() * 5}s`,
      delay: `-${Math.random() * 8}s`,
      size: `${1 + Math.random() * 3}rem`
    }));
  }

}
