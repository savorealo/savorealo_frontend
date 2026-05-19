import { Component, inject, OnInit } from '@angular/core'
import { AppShell } from "@shared/components/app-shell/app-shell";
import { FeedStore } from '@core/store/feed.store';
import { PostCard } from '@shared/components/post-card/post-card';
import { SavoLoader } from '@shared/components/savo-loader/savo-loader';

@Component({
  selector: 'app-home',
  imports: [AppShell, PostCard, SavoLoader],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  feedStore = inject(FeedStore)

  ngOnInit() {
    if (this.feedStore.posts().length === 0) {
      this.feedStore.loadHomeFeed()
    }
  }
}
