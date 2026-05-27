import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core'
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
import { ShareProfileModal, ShareableProfile } from '@features/messages/components/share-profile-modal/share-profile-modal'
import { TranslatePipe } from '@shared/pipes/translate.pipe'
import { TranslationService } from '@core/services/translation.service'

/**
 * Clase de utilidad para el perfil del chef.
 */
@Component({
  selector: 'app-profile',
  imports: [AppShell, Avatar, TabsModule, DialogModule, RouterLink, EditProfileComponent, NgOptimizedImage, ImgFallbackDirective, ShareProfileModal, TranslatePipe],
  templateUrl: './profile.html',
})
/**
 * Componente que representa la página de perfil personal del usuario autenticado.
 * Muestra el avatar del chef, biografía, insignias del usuario y pestañas navegables
 * para consultar sus propias publicaciones, sus recetas guardadas y sus publicaciones favoritas (Liked).
 */
export class Profile {
  /**
   * Almacén de estado de autenticación inyectado.
   */
  private readonly authStore = inject(AuthStore)

  /**
   * Servicio de usuarios inyectado para peticiones y gestiones.
   */
  private readonly userService = inject(UserService)

  /**
   * Servicio para la obtención de publicaciones.
   */
  private readonly feedService = inject(FeedService)

  /**
   * Servicio inyectado de acciones globales de publicaciones.
   */
  private readonly postActions = inject(PostActionsService)

  /**
   * Referencia inyectada para el desvínculo automático de suscripciones al destruir el componente.
   */
  private readonly destroyRef = inject(DestroyRef)

  /**
   * Servicio del enrutador inyectado para la navegación interna.
   */
  readonly router = inject(Router)

  /**
   * Servicio de traducción inyectado para traducción en TypeScript.
   */
  private readonly translationService = inject(TranslationService)

  /**
   * Señal que devuelve la información del perfil del usuario autenticado actual.
   */
  readonly profile = this.authStore.profile

  /**
   * Colección de publicaciones propias del usuario.
   */
  readonly posts = signal<Post[]>([])

  /**
   * Señal que indica si sus publicaciones propias están cargando del servidor.
   */
  readonly loadingPosts = signal(false)

  /**
   * Señal que gestiona la visibilidad del modal para la edición de perfil.
   */
  readonly showEditProfile = signal(false)

  /**
   * Señal reactiva que gestiona los datos de perfil para el diálogo modal de compartir.
   */
  readonly sharingProfile = signal<ShareableProfile | null>(null)

  /**
   * Colección de publicaciones guardadas por el usuario.
   */
  readonly savedPosts = signal<Post[]>([])

  /**
   * Indica si las publicaciones guardadas están cargando del servidor.
   */
  readonly loadingSaved = signal(false)

  /**
   * Bandera que evita cargar publicaciones guardadas repetidamente si ya se han cargado una vez.
   */
  readonly savedLoaded = signal(false)

  /**
   * Colección de publicaciones que le gustan al usuario.
   */
  readonly likedPosts = signal<Post[]>([])

  /**
   * Indica si las publicaciones que le gustan al usuario están cargando del servidor.
   */
  readonly loadingLiked = signal(false)

  /**
   * Bandera que evita cargar publicaciones que le gustan repetidamente si ya se han cargado.
   */
  readonly likedLoaded = signal(false)

  /**
   * Índice o identificador del Tab activo (0: Publicaciones, 1: Guardados, 2: Likes).
   */
  readonly activeTab = signal('0')

  /**
   * Señal calculada con el nombre a mostrar del usuario.
   */
  readonly displayName = computed(() => this.profile()?.fullName || this.profile()?.username || 'Chef Savorealo')

  /**
   * Señal calculada con el handle de usuario.
   */
  readonly username = computed(() => this.profile()?.username || 'usuario')

  /**
   * Señal calculada con la ubicación del usuario.
   */
  readonly location = computed(() => this.profile()?.location || this.translationService.translate('profile.no_location'))

  /**
   * Señal calculada con la biografía corta del perfil del usuario.
   */
  readonly bio = computed(() => this.profile()?.bio || this.translationService.translate('profile.bio_fallback'))

  /**
   * Señal calculada con la descripción del año de nacimiento o inicio en la plataforma.
   */
  readonly joinedLabel = computed(() => {
    const birthDate = this.profile()?.birth_date
    if (birthDate) {
      const joinedSince = this.translationService.translate('profile.joined_since')
      return `${joinedSince} ${new Date(birthDate).getFullYear()}`
    }
    return this.translationService.translate('profile.in_construction')
  })

  /**
   * Cantidad calculada de recetas publicadas por el chef.
   */
  readonly postsCount = computed(() => this.posts().length > 0 ? this.posts().length : (this.profile()?.postsCount ?? 0))

  /**
   * Listado de insignias (badges) destacadas de gamificación del perfil del usuario.
   */
  readonly badges = [
    { icon: 'pi pi-star-fill', labelKey: 'profile.badge.active_chef.label', descKey: 'profile.badge.active_chef.desc' },
    { icon: 'pi pi-heart-fill', labelKey: 'profile.badge.favorites.label', descKey: 'profile.badge.favorites.desc' },
    { icon: 'pi pi-bookmark-fill', labelKey: 'profile.badge.curator.label', descKey: 'profile.badge.curator.desc' },
  ]

  /**
   * Inicializa el componente.
   * Realiza la carga diferida inicial de los posts del usuario autenticado en el cliente
   * y configura la reactividad ante eventos globales de me gusta o guardado de posts.
   */
  constructor() {
    afterNextRender(() => {
      const userId = this.authStore.currentUserId()
      if (!userId) return
      this.loadingPosts.set(true)
      this.userService.getUserPosts(userId).pipe(
        finalize(() => this.loadingPosts.set(false)),
      ).subscribe({
        next: page => this.posts.set(page.posts),
        error: () => {},
      })
    })
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

  /**
   * Solicita al servidor el listado de publicaciones guardadas por el usuario autenticado.
   */
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

  /**
   * Solicita al servidor el listado de publicaciones marcadas con "me gusta" por el usuario.
   */
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

  /**
   * Responde al cambio de pestaña y dispara la carga bajo demanda de la información requerida.
   * @param value Identificador o valor del Tab activo.
   */
  onTabChange(value: string | number | undefined): void {
    const tab = String(value ?? '0')
    this.activeTab.set(tab)
    if (tab === '1') this.loadSaved()
    if (tab === '2') this.loadLiked()
  }

  /**
   * Abre la ventana modal para compartir el perfil propio a través de chats de mensajería interna.
   */
  openShareProfile(): void {
    const profile = this.profile()
    const id = this.authStore.currentUserId()
    if (!profile || !id) return
    this.sharingProfile.set({
      id,
      username: profile.username,
      displayName: profile.fullName,
      photoUrl: profile.photo_url,
    })
  }

  /**
   * Cierra de forma completa la sesión activa.
   */
  logOut(): void {
    this.authStore.logout()
  }
}
