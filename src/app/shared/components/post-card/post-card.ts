import { Component, EventEmitter, Input, Output } from "@angular/core";

export interface Post {
  id: string;
  author: { name: string; photo?: string; username: string; };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
  createdAt: Date | string;
}

/**
 * <!-- Uso en el feed -->
  <app-post-card
    @for(post of posts){
      [post]="post"
      (onLike)="toggleLike($event)"
      (onComment)="openComments($event)"
      (onShare)="sharePost($event)"
      (onSave)="toggleSave($event)"
      (onOptions)="openOptions($event)"
    }
  />
 *  */

@Component({
  selector: 'app-post-card',
  template: '',
  standalone: true
})
export class PostCard {
  @Input({ required: true }) post!: Post;

  @Output() onLike = new EventEmitter<Post>();
  @Output() onComment = new EventEmitter<Post>();
  @Output() onShare = new EventEmitter<Post>();
  @Output() onSave = new EventEmitter<Post>();
  @Output() onOptions = new EventEmitter<Post>();

  expanded = false;
}

/**Mas casos de uso
 * <!-- Feed principal -->
<app-post-card [post]="post" (onLike)="toggleLike($event)" />

<!-- Post con imagen -->
<app-post-card [post]="postWithImage" (onSave)="toggleSave($event)" />

<!-- Post con texto largo (truncado) -->
<app-post-card [post]="longPost" />

<!-- Post ya likeado -->
<!-- El estado viene en post.liked = true, el componente lo pinta solo -->

<!-- Lista completa del feed -->
<div class="flex flex-col gap-3">
  <app-post-card
    *ngFor="let post of feed; trackBy: trackById"
    [post]="post"
    (onLike)="toggleLike($event)"
    (onComment)="openComments($event)"
    (onShare)="share($event)"
    (onSave)="toggleSave($event)"
    (onOptions)="openOptions($event)"
  />
</div>
 */
