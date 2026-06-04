import {
	Component,
	computed,
	effect,
	ElementRef,
	inject,
	OnDestroy,
	OnInit,
	PLATFORM_ID,
	viewChild,
} from '@angular/core'
import { isPlatformBrowser, NgClass } from '@angular/common'
import { GlobalSearchStore } from '@core/store/global-search.store'
import { TranslationService } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

/**
 * Componente que representa el panel flotante de búsqueda global en la aplicación.
 * Permite buscar de forma interactiva y rápida recetas y usuarios mediante el atajo Ctrl+K / Cmd+K.
 */
@Component({
	selector: 'app-global-search-panel',
	templateUrl: './global-search-panel.html',
	styleUrls: ['./global-search-panel.css'],
	imports: [NgClass, TranslatePipe],
})
export class GlobalSearchPanel implements OnInit, OnDestroy {
	/**
	 * Almacén de estado que gestiona las consultas y resultados de la búsqueda global.
	 */
	readonly store = inject(GlobalSearchStore)

	/**
	 * Servicio para la traducción de etiquetas literales y de accesibilidad.
	 */
	readonly t = inject(TranslationService)

	/**
	 * Determina si la aplicación se ejecuta en el navegador (para poder añadir listeners de teclado).
	 */
	private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

	/**
	 * Referencia de vista al elemento input HTML para la auto-focalización dinámica.
	 */
	private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('searchInput')

	/**
	 * Señal calculada que indica si se obtuvieron resultados de usuarios o publicaciones con la consulta actual.
	 */
	readonly hasResults = computed(() =>
		this.store.users().length > 0 || this.store.posts().length > 0,
	)

	/**
	 * Señal calculada que indica si la sección de usuarios debe renderizarse.
	 */
	readonly showUsers = computed(() =>
		this.store.tab() !== 'posts' && this.store.users().length > 0,
	)

	/**
	 * Señal calculada que indica si la sección de publicaciones debe renderizarse.
	 */
	readonly showPosts = computed(() =>
		this.store.tab() !== 'users' && this.store.posts().length > 0,
	)

	/**
	 * Crea una instancia de GlobalSearchPanel y establece un efecto para enfocar automáticamente el campo de texto cuando se abre el panel.
	 */
	constructor() {
		// Auto-focus input when panel opens
		effect(() => {
			if (this.store.open()) {
				setTimeout(() => this.inputEl()?.nativeElement.focus(), 50)
			}
		})
	}

	/**
	 * Método del ciclo de vida que agrega el listener de teclado global.
	 */
	ngOnInit(): void {
		if (this.isBrowser) document.addEventListener('keydown', this.handleKeydown)
	}

	/**
	 * Método del ciclo de vida para remover listeners de teclado al destruir el componente.
	 */
	ngOnDestroy(): void {
		if (this.isBrowser) document.removeEventListener('keydown', this.handleKeydown)
	}

	/**
	 * Manejador del evento keydown del documento global para capturar combinaciones del atajo de teclado de búsqueda y cierre por escape.
	 */
	private readonly handleKeydown = (e: KeyboardEvent): void => {
		// ⌘K or Ctrl+K → open
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault()
			if (this.store.open()) {
				this.store.closePanel()
			} else {
				this.store.openPanel()
			}
			return
		}
		// Escape → close
		if (e.key === 'Escape' && this.store.open()) {
			this.store.closePanel()
		}
	}

	/**
	 * Evento al teclear en el input de búsqueda. Modifica la query en el almacén de búsqueda global.
	 * @param event Evento de entrada de caracteres.
	 */
	onInput(event: Event): void {
		const val = (event.target as HTMLInputElement).value
		this.store.setQuery(val)
	}

	/**
	 * Envía la consulta actual y navega a la página de búsqueda/exploración principal.
	 */
	onSubmit(): void {
		if (this.store.query().trim()) {
			this.store.goToExplore()
		}
	}
}
