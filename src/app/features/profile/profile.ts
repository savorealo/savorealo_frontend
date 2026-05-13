import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { finalize } from 'rxjs'
import { AuthStore } from '@core/store/auth.store'
import { UserService } from '@core/services/user.service'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { TabsModule } from 'primeng/tabs'
import { DialogModule } from 'primeng/dialog'
import { Router, RouterLink } from '@angular/router'
import { EditProfileComponent } from './edit-profile/edit-profile'
import { NgOptimizedImage } from '@angular/common'

@Component({
  selector: 'app-profile',
  imports: [AppShell, Avatar, TabsModule, DialogModule, RouterLink, EditProfileComponent, NgOptimizedImage],
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  private readonly authStore = inject(AuthStore)
  private readonly userService = inject(UserService)
  readonly router = inject(Router)

  readonly profile = this.authStore.profile
  readonly posts = signal<Post[]>([])
  readonly loadingPosts = signal(false)
  readonly showEditProfile = signal(false)

  readonly displayName = computed(() => this.profile()?.fullName || this.profile()?.username || 'Chef Savorealo')
  readonly username = computed(() => this.profile()?.username || 'usuario')
  readonly location = computed(() => this.profile()?.location || 'Sin ubicacion')
  readonly bio = computed(() => this.profile()?.bio || 'Comparte tu bio para que la comunidad conozca tu estilo de cocina.')
  readonly joinedLabel = computed(() => {
    const birthDate = this.profile()?.birth_date
    return birthDate ? `Perfil completo desde ${new Date(birthDate).getFullYear()}` : 'Perfil en construccion'
  })
  readonly postsCount = computed(() => this.profile()?.postsCount ?? this.posts().length)

  readonly badges = [
    { icon: 'pi pi-star-fill', label: 'Chef activo', description: 'Publica recetas con frecuencia' },
    { icon: 'pi pi-heart-fill', label: 'Favoritos', description: 'Sus recetas reciben buen feedback' },
    { icon: 'pi pi-bookmark-fill', label: 'Curador', description: 'Guarda ideas para cocinar mejor' },
  ]

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

  logOut(): void {
    this.authStore.logout()
  }
}
