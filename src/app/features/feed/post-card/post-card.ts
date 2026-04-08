import { Component, Input, signal, computed } from '@angular/core'
import { NgClass, NgStyle } from '@angular/common'
import { Avatar } from '@shared/components/avatar/avatar'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { TruncateTextPipe } from '@shared/pipes/truncate.pipe'
import { Post } from '@core/models/post/post.model'

@Component({
  selector: 'app-post-card',
  imports: [NgClass, NgStyle, Avatar, TimeAgoPipe, TruncateTextPipe],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss',
})
export class PostCard {
  @Input({ required: true }) post!: Post

  currentMediaIndex = signal(0)
  liked             = signal(false)
  saved             = signal(false)
  expanded          = signal(false)

  ngOnInit() {
    this.liked.set(this.post.liked)
    this.saved.set(this.post.saved)
  }

  get media() { return this.post.media ?? [] }

  get currentMedia() { return this.media[this.currentMediaIndex()] }

  get hasMultipleMedia() { return this.media.length > 1 }

  get difficultyLabel(): string {
    const map: Record<string, string> = { EASY: 'Fácil', MEDIUM: 'Medio', HARD: 'Difícil' }
    return map[this.post.recipe?.difficulty ?? ''] ?? ''
  }

  get difficultyClass(): string {
    const map: Record<string, string> = {
      EASY:   'difficulty--easy',
      MEDIUM: 'difficulty--medium',
      HARD:   'difficulty--hard',
    }
    return map[this.post.recipe?.difficulty ?? ''] ?? ''
  }

  prevMedia() {
    this.currentMediaIndex.update(i => (i - 1 + this.media.length) % this.media.length)
  }

  nextMedia() {
    this.currentMediaIndex.update(i => (i + 1) % this.media.length)
  }

  goToMedia(index: number) {
    this.currentMediaIndex.set(index)
  }

  toggleLike() {
    this.liked.update(v => !v)
    // TODO: llamar al servicio
  }

  toggleSave() {
    this.saved.update(v => !v)
    // TODO: llamar al servicio
  }

  toggleExpanded() {
    this.expanded.update(v => !v)
  }

  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k'
    return String(n)
  }
}
