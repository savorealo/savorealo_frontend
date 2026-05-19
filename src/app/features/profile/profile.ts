import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { finalize } from 'rxjs'
import { AuthStore } from '@core/store/auth.store'
import { UserService } from '@core/services/user.service'
import { FeedService } from '@core/services/feed.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TabsModule } from 'primeng/tabs'
import { DialogModule } from 'primeng/dialog'
import { Router, RouterLink } from '@angular/router'
import { EditProfileComponent } from './edit-profile/edit-profile'
import { NgOptimizedImage } from '@angular/common'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'

@Component({
  selector: 'app-profile',
  imports: [AppShell, Avatar, TabsModule, DialogModule, RouterLink, EditProfileComponent, NgOptimizedImage, ImgFallbackDirective],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly authStore = inject(AuthStore)
  private readonly userService = inject(UserService)
  private readonly feedService = inject(FeedService)
  private readonly postActions = inject(PostActionsService)
  private readonly destroyRef = inject(DestroyRef)
  readonly router = inject(Router)

  readonly profile = this.authStore.profile
  readonly posts = signal<Post[]>([])
  readonly loadingPosts = signal(false)
  readonly showEditProfile = signal(false)

  readonly savedPosts = signal<Post[]>([])
  readonly loadingSaved = signal(false)
  readonly savedLoaded = signal(false)

  readonly likedPosts = signal<Post[]>([])
  readonly loadingLiked = signal(false)
  readonly likedLoaded = signal(false)

  readonly activeTab = signal('0')

  readonly displayName = computed(() => this.profile()?.fullName || this.profile()?.username || 'Chef Savorealo')
  readonly username = computed(() => this.profile()?.username || 'usuario')
  readonly location = computed(() => this.profile()?.location || 'Sin ubicacion')
  readonly bio = computed(() => this.profile()?.bio || 'Comparte tu bio para que la comunidad conozca tu estilo de cocina.')
  readonly joinedLabel = computed(() => {
    const birthDate = this.profile()?.birth_date
    return birthDate ? `Perfil completo desde ${new Date(birthDate).getFullYear()}` : 'Perfil en construccion'
  })
  readonly postsCount = computed(() => this.posts().length > 0 ? this.posts().length : (this.profile()?.postsCount ?? 0))

  readonly badges = [
    { icon: 'pi pi-star-fill', label: 'Chef activo', description: 'Publica recetas con frecuencia' },
    { icon: 'pi pi-heart-fill', label: 'Favoritos', description: 'Sus recetas reciben buen feedback' },
    { icon: 'pi pi-bookmark-fill', label: 'Curador', description: 'Guarda ideas para cocinar mejor' },
  ]

  constructor() {
    this.postActions.likeChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e => {
      this.posts.update(ps => ps.map(p =>
        p.id === e.postId ? { ...p, liked: e.liked, likesCount: e.likesCount } : p,
      ))
      this.likedLoaded.set(false)
    })
    this.postActions.saveChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e => {
      this.posts.update(ps => ps.map(p =>
        p.id === e.postId ? { ...p, saved: e.saved, savesCount: e.savesCount } : p,
      ))
      this.savedLoaded.set(false)
    })
  }

  ngOnInit(): void {
    const userId = this.authStore.currentUserId()
    if (!userId) return
    this.loadingPosts.set(true)
    this.userService.getUserPosts(userId).pipe(
      finalize(() => this.loadingPosts.set(false)),
    ).subscribe({
      next: page => this.posts.set(page.posts),
      error: () => {},
    })
  }

  loadSaved(): void {
    if (this.savedLoaded()) return
    this.loadingSaved.set(true)
    this.feedService.getSavedPosts(24).pipe(
      finalize(() => this.loadingSaved.set(false)),
    ).subscribe({
      next: page => {
        this.savedPosts.set(page.posts)
        this.savedLoaded.set(true)
      },
      error: () => { this.savedLoaded.set(true) },
    })
  }

  loadLiked(): void {
    if (this.likedLoaded()) return
    this.loadingLiked.set(true)
    this.feedService.getLikedPosts(24).pipe(
      finalize(() => this.loadingLiked.set(false)),
    ).subscribe({
      next: page => {
        this.likedPosts.set(page.posts)
        this.likedLoaded.set(true)
      },
      error: () => { this.likedLoaded.set(true) },
    })
  }

  onTabChange(value: string | number | undefined): void {
    const tab = String(value ?? '0')
    this.activeTab.set(tab)
    if (tab === '1') this.loadSaved()
    if (tab === '2') this.loadLiked()
  }

  logOut(): void {
    this.authStore.logout()
  }
}
