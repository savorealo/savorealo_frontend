import { afterNextRender, Component, inject } from '@angular/core'
import { AppShell } from "@shared/components/app-shell/app-shell";
import { FeedStore } from '@core/store/feed.store';
import { PostCard } from '@shared/components/post-card/post-card';
import { SavoLoader } from '@shared/components/savo-loader/savo-loader';

/**
 * Clase de utilidad para home.
 */
@Component({
  selector: 'app-home',
  imports: [AppShell, PostCard, SavoLoader],
  templateUrl: './home.html',
})
export class Home {
  /**
   * Propiedad para gestionar feed store.
   */
  feedStore = inject(FeedStore)

  /**
   * Constructor de la clase o componente para inicializar dependencias.
   */
  constructor() {
    afterNextRender(() => {
      if (this.feedStore.isStale()) {
        this.feedStore.loadHomeFeed()
      }
    })
  }
}
