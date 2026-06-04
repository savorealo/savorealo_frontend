import { NgOptimizedImage } from '@angular/common'
import { Component, computed, DestroyRef, inject, input, output, signal, ViewChild } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Router, RouterLink } from '@angular/router'
import { Post } from '@core/models/post/post.model'
import { ContentTranslationService } from '@core/services/content-translation.service'
import { PostActionsService } from '@core/services/post-actions.service'
import { PreferencesService } from '@core/services/preferences.service'
import { TranslationService } from '@core/services/translation.service'
import { VeganConvertModal } from '@features/feed/components/vegan-convert-modal/vegan-convert-modal'
import { Avatar } from '@shared/components/avatar/avatar'
import { ImgFallbackDirective } from '@shared/directives/img-fallback.directive'
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe'
import { TruncateTextPipe } from '@shared/pipes/truncate.pipe'
import { TranslatePipe } from '@shared/pipes/translate.pipe'
import { finalize } from 'rxjs/operators'
import { MenuItem } from 'primeng/api'
import { Menu } from 'primeng/menu'

/**
 * Componente que representa la tarjeta visual para mostrar una receta o publicación en el feed.
 * Soporta interactividad como likes, guardado, compartir, reporte y navegación al modo cocina.
 */
@Component({
	selector: 'app-post-card',
	imports: [Avatar, Menu, NgOptimizedImage, RouterLink, TimeAgoPipe, TruncateTextPipe, VeganConvertModal, ImgFallbackDirective, TranslatePipe],
	templateUrl: './post-card.html',
})
export class PostCard {
	/**
	 * Referencia de vista al menú desplegable de opciones adicionales en la tarjeta.
	 */
	@ViewChild('optionsMenu') private optionsMenu?: Menu

	/**
	 * Servicio de enrutador inyectado para la navegación interna.
	 */
	private readonly router = inject(Router)

	/**
	 * Servicio inyectado para el manejo de acciones globales de publicaciones (Likes, guardados).
	 */
	private readonly postActions = inject(PostActionsService)

	/**
	 * Servicio de preferencias inyectado para consultar configuraciones dietéticas del usuario.
	 */
	readonly preferences = inject(PreferencesService)

	/**
	 * Servicio de traducción de contenido dinámico vía MyMemory API.
	 */
	private readonly contentTranslation = inject(ContentTranslationService)

	/**
	 * Servicio de traducción de UI para leer el idioma activo.
	 */
	private readonly translationService = inject(TranslationService)

	/**
	 * DestroyRef para cancelar suscripciones al destruir el componente.
	 */
	private readonly destroyRef = inject(DestroyRef)

	/**
	 * Señal que almacena el texto traducido del contenido del post. Null cuando se muestra el original.
	 */
	translatedContent = signal<string | null>(null)

	/**
	 * Señal que indica si la traducción está en curso.
	 */
	translateLoading = signal(false)

	/**
	 * Señal que indica si la última traducción falló.
	 */
	translateError = signal(false)

	/**
	 * Señal calculada que devuelve el contenido traducido si está disponible, o el original.
	 */
	displayContent = computed(() => this.translatedContent() ?? this.content())

	/**
	 * Señal calculada que indica si el post está mostrando la traducción.
	 */
	isTranslated = computed(() => this.translatedContent() !== null)

	/**
	 * Señal calculada que devuelve la dirección de texto del idioma activo ('rtl' para árabe).
	 */
	translationDir = computed(() =>
		this.translationService.currentLang() === 'ar' ? 'rtl' : 'ltr'
	)

	/**
	 * Publicación o receta de entrada requerida para rellenar la tarjeta.
	 */
	post = input.required<Post>()

	/**
	 * Evento emitido al hacer clic en la acción de comentar la publicación.
	 */
	comment = output<Post>()

	/**
	 * Evento emitido para abrir el modal de reporte de la publicación.
	 */
	report = output<Post>()

	/**
	 * Evento emitido al hacer clic en compartir la publicación.
	 */
	share = output<Post>()

	/**
	 * Señal reactiva que gestiona si el texto completo de la publicación está expandido.
	 */
	expanded       = signal(false)

	/**
	 * Señal reactiva que controla la animación momentánea de la pulsación de Like.
	 */
	likeAnimating  = signal(false)

	/**
	 * Señal que controla si se visualiza el modal de asistente para conversión vegana.
	 */
	veganModalOpen = signal(false)

	/**
	 * Señal que controla si se visualiza el modal de asistente para conversión vegetariana.
	 */
	vegetarianModalOpen = signal(false)

	/**
	 * Señal calculada que indica si el usuario actual ha reaccionado con 'Me gusta' a esta publicación.
	 */
	readonly liked      = computed(() => this.postActions.isLiked(this.post().id, this.post().liked))

	/**
	 * Señal calculada con el número consolidado de 'Me gusta' de la publicación.
	 */
	readonly likesCount = computed(() => this.postActions.likesCount(this.post().id, this.post().likesCount))

	/**
	 * Señal calculada que indica si la publicación está guardada por el usuario en sus colecciones.
	 */
	readonly saved      = computed(() => this.postActions.isSaved(this.post().id, this.post().saved))

	/**
	 * Señal calculada con el número consolidado de guardados de la publicación.
	 */
	readonly savesCount = computed(() => this.postActions.savesCount(this.post().id, this.post().savesCount))

	/**
	 * Señal calculada que obtiene el archivo multimedia principal (la primera imagen) de la lista de recursos de la publicación.
	 */
	primaryMedia = computed(() => this.post().media[0] ?? null)

	/**
	 * Señal calculada que resuelve el nombre del autor, priorizando su nombre real, usuario o un texto predeterminado.
	 */
	authorName = computed(() =>
		this.post().author.name || this.post().author.username || 'Chef anonimo',
	)

	/**
	 * Señal calculada que resuelve el identificador público o handle del autor precedido por '@'.
	 */
	authorHandle = computed(() =>
		this.post().author.username ? `@${this.post().author.username}` : 'savorealo',
	)

	/**
	 * Señal calculada que genera los parámetros de ruta de navegación hacia el perfil del autor.
	 */
	profileLink = computed(() =>
		this.post().author.username ? ['/profile', this.post().author.username] : ['/profile'],
	)

	/**
	 * Señal calculada que genera la ruta de navegación para ver el detalle completo de la publicación.
	 */
	postLink = computed(() => ['/post', this.post().id])

	/**
	 * Señal calculada que concatena el título y la descripción para formar el cuerpo del contenido textual.
	 */
	content = computed(() =>
		[this.post().title, this.post().description].filter(Boolean).join('\n\n'),
	)

	/**
	 * Señal calculada que determina si la publicación tiene una extensión textual larga que requiera truncado inicial.
	 */
	hasLongContent = computed(() => this.content().length > 96)

	/**
	 * Señal calculada que genera las opciones del menú contextual de la tarjeta adaptadas a si ya está guardada o no.
	 */
	menuItems = computed<MenuItem[]>(() => [
		{
			label: this.saved() ? 'Quitar guardado' : 'Guardar',
			icon: this.saved() ? 'pi pi-bookmark-fill' : 'pi pi-bookmark',
			command: () => this.triggerSave(),
		},
		{
			label: 'Reportar',
			icon: 'pi pi-flag',
			command: () => this.report.emit(this.post()),
		},
	])

	/**
	 * Alterna el estado de visibilidad del menú contextual de opciones adicionales de la tarjeta.
	 * @param event Evento desencadenante de la interacción.
	 */
	toggleMenu(event: Event): void {
		this.optionsMenu?.toggle(event)
	}

	/**
	 * Dispara la acción de dar/quitar 'Me gusta' y gestiona el lanzamiento de la animación visual.
	 */
	triggerLike(): void {
		this.likeAnimating.set(true)
		setTimeout(() => this.likeAnimating.set(false), 400)
		this.postActions.toggleLike(this.post().id, this.liked(), this.likesCount())
	}

	/**
	 * Dispara la acción de guardar/quitar de guardados la publicación actual.
	 */
	triggerSave(): void {
		this.postActions.toggleSave(this.post().id, this.saved(), this.savesCount())
	}

	/**
	 * Redirecciona al usuario al modo de cocina guiada para preparar la receta de la tarjeta.
	 */
	openCookingMode(): void {
		this.router.navigate(['/cook', this.post().id])
	}

	/**
	 * Alterna entre mostrar la traducción y el texto original del post.
	 * La primera vez llama a la API; las siguientes usan la caché del servicio.
	 */
	triggerTranslate(): void {
		if (this.isTranslated()) {
			this.translatedContent.set(null)
			return
		}
		const text = this.content()
		if (!text) return
		this.translateLoading.set(true)
		this.translateError.set(false)
		this.contentTranslation.translate(text)
			.pipe(
				finalize(() => this.translateLoading.set(false)),
				takeUntilDestroyed(this.destroyRef),
			)
			.subscribe({
				next: result => this.translatedContent.set(result),
				error: ()     => this.translateError.set(true),
			})
	}
}
