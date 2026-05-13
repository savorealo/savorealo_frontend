import { NgClass } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-avatar',
  imports: [
    NgClass
  ],
  template: `
    <div
      class="avatar"
      [ngClass]="'avatar avatar--' + size"
      [attr.aria-label]="name || 'Avatar'"
      role="img"
    >
      @if (src && !imgError) {
        <img
          [src]="src"
          [alt]="name || 'Avatar'"
          (error)="onImgError()"
          class="avatar__img"
        />
      }
      @if(!src || imgError) {
        <span class="avatar__initials">{{ initials }}</span>
      }

      @if(showOnline) {
        <span class="avatar__badge avatar__badge--online"></span>
      }
      @if(showOffline) {
        <span class="avatar__badge avatar__badge--offline"></span>
      }
    </div>
  `,
  styleUrl: './avatar.scss',
})
export class Avatar implements OnChanges {
  @Input() src?: string | null;
  @Input() name?: string;
  @Input() size: AvatarSize = "md"
  @Input() online?: boolean;
  @Input() offline?: boolean;


  initials = '';
  imgError = false;

  get showOnline() { return this.online === true; }
  get showOffline() { return this.offline === true && !this.online; }

  ngOnChanges(): void {
    this.imgError = false;
    this.initials = this.getInitials(this.name);
  }

  onImgError(): void {
    this.imgError = true;
  }

  private getInitials(name?: string): string {
    if (!name?.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
