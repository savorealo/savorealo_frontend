import { Component, EventEmitter, Input, Output } from '@angular/core'
import { ButtonComponent } from "../button/button";
import { Avatar } from "../avatar/avatar";

interface User {
  photo: string;
  name: string;
  username: string;
  bio?: string;
  following: boolean;
}

/**
 * <!-- Sugerencias de usuarios -->
  <div class="flex flex-col gap-2">
    <app-user-card
      *ngFor="let user of suggestions"
      [user]="user"
      (onFollow)="toggleFollow($event)"
    />
  </div>

  <!-- Resultados de búsqueda -->
  <app-user-card [user]="result" (onFollow)="toggleFollow($event)" />

  <!-- Lista de seguidores / siguiendo -->
  <app-user-card
    *ngFor="let follower of followers; trackBy: trackById"
    [user]="follower"
    (onFollow)="toggleFollow($event)"
/>
 *  */

@Component({
  selector: 'app-user-card',
  imports: [ButtonComponent, Avatar],
  template: `
  <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">

      <app-avatar [src]="user.photo" [name]="user.name" size="md" />

      <div class="flex flex-col flex-1 min-w-0">
        <span class="text-sm font-medium text-gray-900 truncate">{{ user.name }}</span>
        <span class="text-xs text-gray-400 truncate">@{{ user.username }}</span>
        @if(user.bio) {
          <span class="text-xs text-gray-500 truncate mt-0.5">{{ user.bio }}</span>
        }
      <app-button
        [label]="user.following ? 'Siguiendo' : 'Seguir'"
        [variant]="user.following ? 'secondary' : 'primary'"
        size="sm"
        (click)="onFollow.emit(user)"
      />
    </div>
  `
})
export class UserCard {
  @Input({ required: true }) user!: User;
  @Output() onFollow = new EventEmitter<User>();
}
