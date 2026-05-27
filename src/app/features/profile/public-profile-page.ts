import { afterNextRender, Component, computed, DestroyRef, inject, signal } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { finalize } from 'rxjs'
import { UserService, PublicUser, FollowListUser } from '@core/services/user.service'
import { AuthStore } from '@core/store/auth.store'
import { ToastService } from '@core/services/toast.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { Post } from '@core/models/post/post.model'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { Avatar } from '@shared/components/avatar/avatar'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'
import { TabsModule } from 'primeng/tabs'
import { DialogModule } from 'primeng/dialog'
import { ShareProfileModal, ShareableProfile } from '@features/messages/components/share-profile-modal/share-profile-modal'
import { TranslationService } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Componente principal para la vista o página de publicprofile.
 */
@Component({
	selector: 'app-public-profile-page',
	imports: [AppShell, Avatar, RouterLink, TabsModule, DialogModule, ImgFallbackDirective, ShareProfileModal, TranslatePipe],
	templateUrl: './public-profile-page.html',
})
/**
 * Componente que representa la página de visualización del perfil público de otro chef o usuario.
 * Proporciona interacciones para seguir/dejar de seguir, enviar mensajes de chat directos, ver listas de seguidores/siguiendo
 * y explorar sus recetas publicadas respetando las configuraciones de privacidad de la cuenta.
 */
export class PublicProfilePage {
	/**
	 * Servicio para la obtención de parámetros e información de la ruta activa de Angular.
	 */
	private readonly route = inject(ActivatedRoute)

	/**
	 * Servicio del router inyectado para la navegación interna.
	 */
	readonly router = inject(Router)

	/**
	 * Servicio de localización para la obtención de traducciones dinámicas.
	 */
	private readonly t = inject(TranslationService)

	/**
	 * Servicio inyectado para realizar peticiones de datos de usuarios.
	 */
	private readonly userService = inject(UserService)

	/**
	 * Almacén de estado de autenticación inyectado.
	 */
	private readonly authStore   = inject(AuthStore)

	/**
	 * Servicio de notificaciones toast.
	 */
	private readonly toast       = inject(ToastService)

	/**
	 * Servicio inyectado de acciones globales de posts.
	 */
	private readonly postActions = inject(PostActionsService)

	/**
	 * Referencia de destrucción inyectada para desvincular observables.
	 */
	private readonly destroyRef  = inject(DestroyRef)

	/**
	 * Señal con la información del perfil público cargado.
	 */
	readonly user          = signal<PublicUser | null>(null)

	/**
	 * Señal reactiva que contiene las recetas y publicaciones del usuario.
	 */
	readonly posts         = signal<Post[]>([])

	/**
	 * Señal que indica si el perfil del usuario se encuentra en proceso de carga.
	 */
	readonly loading       = signal(true)

	/**
	 * Señal que indica si las publicaciones se están obteniendo del servidor.
	 */
	readonly loadingPosts  = signal(false)

	/**
	 * Señal reactiva que contiene información del error de carga si ocurriera alguno.
	 */
	readonly error         = signal<string | null>(null)

	/**
	 * Señal que indica si hay una petición asíncrona de seguimiento en progreso.
	 */
	readonly followLoading = signal(false)

	/**
	 * Señal que gestiona los datos de perfil para el diálogo modal de compartir.
	 */
	readonly sharingProfile = signal<ShareableProfile | null>(null)

	/**
	 * Controla si se visualiza el diálogo modal con las listas de seguimiento (seguidores/siguiendo).
	 */
	readonly showFollowList = signal(false)

	/**
	 * Título dinámico para el modal de listas de seguimiento (Seguidores o Siguiendo).
	 */
	readonly followListTitle = signal('')

	/**
	 * Listado de usuarios cargados para mostrar en la lista de seguimiento del modal.
	 */
	readonly followListUsers = signal<FollowListUser[]>([])

	/**
	 * Indica si se están cargando los datos de la lista de seguimiento del modal.
	 */
	readonly followListLoading = signal(false)

	/**
	 * Señal calculada que determina si el perfil visualizado corresponde al propio usuario autenticado.
	 */
	readonly isOwnProfile = computed(() => {
		const currentUsername = this.authStore.profile()?.username
		const pageUsername = this.route.snapshot.paramMap.get('username')
		return currentUsername === pageUsername
	})

	/**
	 * Nombre a mostrar en cabecera del chef.
	 */
	readonly displayName = computed(() =>
		this.user()?.fullName || this.user()?.username || 'Chef Savorealo',
	)

	/**
	 * Ubicación geográfica si el usuario la ha hecho pública.
	 */
	readonly location = computed(() => this.user()?.location || null)

	/**
	 * Señal calculada que determina si la cuenta del usuario es privada.
	 */
	readonly isPrivate = computed(() => !!this.user()?.isPrivate)

	/**
	 * Señal calculada que determina si el usuario actual tiene permisos para ver el contenido del perfil.
	 */
	readonly isViewable = computed(() => this.user()?.isViewable !== false)

	/**
	 * Señal calculada que determina si el chef visualizado sigue al usuario actual.
	 */
	readonly followsYou = computed(() => !!this.user()?.followsYou)

	/**
	 * Inicializa el componente.
	 * Registra los canales de mensajería reactiva ante cambios en los likes y guardados para sincronizar vistas,
	 * y desencadena la obtención de los datos del perfil del usuario tras el renderizado inicial en cliente.
	 */
	constructor() {
		this.postActions.likeChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e =>
			this.posts.update(ps => ps.map(p =>
				p.id === e.postId ? { ...p, liked: e.liked, likesCount: e.likesCount } : p,
			)),
		)
		this.postActions.saveChanged$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(e =>
			this.posts.update(ps => ps.map(p =>
				p.id === e.postId ? { ...p, saved: e.saved, savesCount: e.savesCount } : p,
			)),
		)
		afterNextRender(() => this.load())
	}

	/**
	 * Obtiene el nombre de usuario de la ruta de navegación activa y carga los datos del perfil del backend.
	 */
	private load(): void {
		const username = this.route.snapshot.paramMap.get('username')
		if (!username) { this.router.navigate(['/']); return }

		if (this.isOwnProfile()) { this.router.navigate(['/profile']); return }

		this.userService.getUserByUsername(username).pipe(
			finalize(() => this.loading.set(false)),
		).subscribe({
			next: user => {
				if (!user) { this.error.set('Usuario no encontrado'); return }
				this.user.set(user)
				if (user.isViewable) this.loadUserPosts(user.id)
			},
			error: err => this.error.set(err.message ?? 'No se pudo cargar el perfil'),
		})
	}

	/**
	 * Solicita al servidor las publicaciones realizadas por el usuario del perfil cargado.
	 * @param userId Identificador único del usuario.
	 */
	private loadUserPosts(userId: string): void {
		this.loadingPosts.set(true)
		this.userService.getUserPosts(userId).pipe(
			finalize(() => this.loadingPosts.set(false)),
		).subscribe({
			next: page => this.posts.set(page.posts),
			error: () => {},
		})
	}

	/**
	 * Abre la ventana modal y carga la colección de seguidores o seguidos de este usuario.
	 * @param type El tipo de lista a consultar ('followers' | 'following').
	 */
	openFollowList(type: 'followers' | 'following'): void {
		const user = this.user()
		if (!user || !this.isViewable()) return

		this.followListTitle.set(type === 'followers' ? this.t.translate('profile.followers') : this.t.translate('profile.following'))
		this.followListUsers.set([])
		this.followListLoading.set(true)
		this.showFollowList.set(true)

		const obs = type === 'followers'
			? this.userService.getFollowers(user.id)
			: this.userService.getFollowing(user.id)

		obs.subscribe({
			next: users => {
				this.followListUsers.set(users)
				this.followListLoading.set(false)
			},
			error: () => this.followListLoading.set(false),
		})
	}

	/**
	 * Redirecciona al chat directo con el usuario del perfil.
	 */
	messageUser(): void {
		const user = this.user()
		if (!user) return
		this.router.navigate(['/chat'], { queryParams: { with: user.id } })
	}

	/**
	 * Abre la ventana modal para compartir el perfil con otros usuarios a través del chat interno de la app.
	 */
	openShareProfile(): void {
		const user = this.user()
		if (!user) return
		this.sharingProfile.set({
			id: user.id,
			username: user.username,
			displayName: user.fullName,
			photoUrl: user.photo_url,
		})
	}

	/**
	 * Alterna de forma asíncrona y optimista el seguimiento del usuario (seguir, dejar de seguir o cancelar solicitud).
	 */
	toggleFollow(): void {
		const user = this.user()
		if (!user || this.followLoading()) return

		const wasStatus = user.followStatus
		const wasFollowers = user.followersCount ?? 0
		this.followLoading.set(true)

		// Optimistic update based on current state
		let optimisticStatus: 'none' | 'following' | 'requested'
		let optimisticFollowers = wasFollowers
		if (wasStatus === 'following') {
			optimisticStatus = 'none'
			optimisticFollowers = wasFollowers - 1
		} else if (wasStatus === 'requested') {
			optimisticStatus = 'none'
		} else {
			optimisticStatus = user.isPrivate ? 'requested' : 'following'
			if (!user.isPrivate) optimisticFollowers = wasFollowers + 1
		}
		this.user.update(u => u ? {
			...u,
			isFollowedByCurrentUser: optimisticStatus === 'following',
			followStatus: optimisticStatus,
			followersCount: optimisticFollowers,
		} : u)

		this.userService.toggleFollow(user.id, wasStatus === 'following').pipe(
			finalize(() => this.followLoading.set(false)),
		).subscribe({
			next: result => {
				const newStatus: 'none' | 'following' | 'requested' =
					result.following ? 'following' : result.requested ? 'requested' : 'none'
				let newFollowers = wasFollowers
				if (result.following && wasStatus !== 'following') newFollowers = wasFollowers + 1
				else if (!result.following && wasStatus === 'following') newFollowers = wasFollowers - 1
				this.user.update(u => u ? {
					...u,
					isFollowedByCurrentUser: result.following,
					followStatus: newStatus,
					followersCount: newFollowers,
				} : u)
				this.postActions.followChanged$.next({
					userId: user.id,
					following: result.following,
					requested: result.requested,
				})
				const name = this.user()?.fullName || this.user()?.username || 'este usuario'
				if (result.following) {
					this.toast.success(`${this.t.translate('public.now_following')} ${name}`, '')
				} else if (result.requested) {
					this.toast.success(`${this.t.translate('public.request_sent')} ${name}`, '')
				} else if (wasStatus === 'requested') {
					this.toast.success(this.t.translate('public.request_cancelled'), '')
				} else {
					this.toast.success(`${this.t.translate('public.unfollowed')} ${name}`, '')
				}
			},
			error: () => {
				this.user.update(u => u ? {
					...u,
					isFollowedByCurrentUser: wasStatus === 'following',
					followStatus: wasStatus,
					followersCount: wasFollowers,
				} : u)
				this.toast.error(this.t.translate('public.follow_error'))
			},
		})
	}
}
