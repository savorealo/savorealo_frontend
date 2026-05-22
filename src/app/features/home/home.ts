import { afterNextRender, Component, inject } from '@angular/core'
import { AppShell } from "@shared/components/app-shell/app-shell";
import { FeedStore } from '@core/store/feed.store';
import { PostCard } from '@shared/components/post-card/post-card';
import { SavoLoader } from '@shared/components/savo-loader/savo-loader';

@Component({
  selector: 'app-home',
  imports: [AppShell, PostCard, SavoLoader],
  templateUrl: './home.html',
})
export class Home {
  feedStore = inject(FeedStore)

  constructor() {
    afterNextRender(() => {
      if (this.feedStore.isStale()) {
        this.feedStore.loadHomeFeed()
      }
    })
  }
}
