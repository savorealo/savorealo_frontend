import { Component, computed, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'
import { ShoppingListService } from './shopping-list.service'
import { ToastService } from '@core/services/toast.service'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { TranslatePipe } from '@shared/pipes/translate.pipe'
import { TranslationService } from '@core/services/translation.service'

/**
 * Interfaz que define las propiedades necesarias para representar e interactuar con un supermercado en línea.
 */
export interface StoreOption {
	/**
	 * Nombre comercial legible del supermercado.
	 */
	name: string

	/**
	 * URL de búsqueda directa del artículo parametrizada.
	 */
	url: string

	/**
	 * Cadena de texto que contiene el logotipo vectorial SVG del supermercado.
	 */
	logoSvg: string
}

// ─── SVG logos ───────────────────────────────────────────────────────────────

/**
 * Diccionario con los gráficos vectoriales SVG de los logotipos de los supermercados soportados.
 */
const SVG = {
	Mercadona: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#00A651"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="20" font-weight="900" fill="white">M</text></svg>`,

	Carrefour: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="white"/><polygon points="4,5 18,16 4,27" fill="#E30613"/><polygon points="28,5 14,16 28,27" fill="#0033A0"/></svg>`,

	Hipercor: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#007A3D"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="18" font-weight="bold" fill="white">H</text></svg>`,

	Día: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#E30613"/><text x="16" y="22" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="14" font-weight="bold" fill="white">Día</text></svg>`,

	Aldi: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#00377B"/><text x="16" y="21" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="13" font-weight="bold" fill="white">aldi</text></svg>`,

	Amazon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#FF9900"/><text x="16" y="17" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="8.5" font-weight="bold" fill="#131921">amazon</text><path d="M9 22 Q16 27 23 22" stroke="#131921" stroke-width="2.5" fill="none" stroke-linecap="round"/><polygon points="22,21 25,24 22,25" fill="#131921"/></svg>`,

	Rewe: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#CC0000"/><text x="16" y="21" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="12" font-weight="bold" fill="white">REWE</text></svg>`,

	Penny: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#CC0000"/><text x="16" y="22" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="11" font-weight="bold" fill="white">penny</text></svg>`,

	Lidl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><circle cx="16" cy="16" r="16" fill="#003DA5"/><circle cx="16" cy="16" r="12" fill="#EF3340"/><circle cx="16" cy="7" r="4.5" fill="#F9D616"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="9" font-weight="bold" fill="white">lidl</text></svg>`,

	Tesco: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#003DA5"/><rect x="5" y="8" width="22" height="2.5" rx="1.25" fill="white"/><text x="16" y="21" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="9" font-weight="bold" fill="white">TESCO</text><rect x="5" y="23.5" width="22" height="2.5" rx="1.25" fill="white"/></svg>`,

	"Sainsbury's": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#F06C00"/><text x="16" y="24" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="22" font-weight="900" fill="white">S</text></svg>`,

	Asda: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#78BE20"/><text x="16" y="21" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="12" font-weight="bold" fill="white">asda</text></svg>`,

	Leclerc: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#003DA5"/><text x="16" y="15" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="12" font-weight="bold" fill="white">E.</text><text x="16" y="26" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="9" font-weight="bold" fill="white">Leclerc</text></svg>`,

	Auchan: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="7" fill="#E63946"/><text x="16" y="22" text-anchor="middle" font-family="system-ui,Arial,sans-serif" font-size="9.5" font-weight="bold" fill="white">Auchan</text></svg>`,
} as const

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Componente que representa la página de la lista de compras de la aplicación.
 * Permite al usuario controlar sus ingredientes, añadir manuales, tachar y buscar ingredientes en supermercados online de su país.
 */
@Component({
	selector: 'app-shopping-list-page',
	imports: [AppShell, RouterLink, FormsModule, TranslatePipe],
	templateUrl: './shopping-list-page.html',
})
export class ShoppingListPage {
	/**
	 * Servicio toast inyectado para mostrar notificaciones informativas.
	 */
	private readonly toast     = inject(ToastService)

	/**
	 * Sanitizador de contenido inyectado para poder pintar logotipos SVG de forma segura.
	 */
	private readonly sanitizer = inject(DomSanitizer)

	/**
	 * Servicio que implementa la lógica de datos de la lista de la compra.
	 */
	readonly list = inject(ShoppingListService)

	/**
	 * Servicio de traducción inyectado para localización en TypeScript.
	 */
	private readonly translationService = inject(TranslationService)

	/**
	 * Señal reactiva que indica si se muestra el modal de confirmación de vaciado total.
	 */
	readonly confirmClear = signal(false)

	/**
	 * Señal calculada con la cantidad de elementos marcados/comprados de la lista.
	 */
	readonly checkedCount = computed(() => this.list.items().filter(i => i.checked).length)

	// ─── Input manual ────────────────────────────────────────────────
	/**
	 * Señal que almacena el nombre del artículo introducido manualmente.
	 */
	readonly manualName     = signal('')

	/**
	 * Señal que almacena la cantidad del artículo introducido manualmente.
	 */
	readonly manualQuantity = signal('')

	/**
	 * Señal que almacena la unidad de medida del artículo introducido manualmente.
	 */
	readonly manualUnit     = signal('')

	/**
	 * Grupos estructurados con unidades de medida tradicionales españolas y sus claves de internacionalización.
	 */
	readonly unitGroups = [
		{
			labelKey: 'shopping.unit.weight',
			options: [
				{ value: 'gramos',     labelKey: 'shopping.unit.grams' },
				{ value: 'kilogramos', labelKey: 'shopping.unit.kilograms' },
			],
		},
		{
			labelKey: 'shopping.unit.volume',
			options: [
				{ value: 'ml',     labelKey: 'shopping.unit.ml' },
				{ value: 'litros', labelKey: 'shopping.unit.liters' },
			],
		},
		{
			labelKey: 'shopping.unit.units',
			options: [
				{ value: 'unidades',  labelKey: 'shopping.unit.units_val' },
				{ value: 'paquetes',  labelKey: 'shopping.unit.packages' },
				{ value: 'latas',     labelKey: 'shopping.unit.cans' },
				{ value: 'bolsas',    labelKey: 'shopping.unit.bags' },
			],
		},
		{
			labelKey: 'shopping.unit.cooking',
			options: [
				{ value: 'cucharadas',   labelKey: 'shopping.unit.tablespoons' },
				{ value: 'cucharaditas', labelKey: 'shopping.unit.teaspoons' },
				{ value: 'tazas',        labelKey: 'shopping.unit.cups' },
				{ value: 'pizcas',       labelKey: 'shopping.unit.pinches' },
			],
		},
	]

	// ─── Modal de supermercados ───────────────────────────────────────
	/**
	 * Señal con el término de búsqueda actual del ingrediente en el modal de supermercados.
	 */
	readonly storeModalSearch = signal<string | null>(null)

	/**
	 * Señal con las opciones de supermercado disponibles.
	 */
	readonly storeModalStores = signal<StoreOption[]>([])

	/**
	 * Sanitiza el código SVG para habilitar su pintado interactivo de forma segura en las plantillas.
	 * @param svg Logotipo en formato vectorial SVG.
	 */
	safeSvg(svg: string): SafeHtml {
		return this.sanitizer.bypassSecurityTrustHtml(svg)
	}

	/**
	 * Traduce la unidad de medida si existe su correspondiente clave localizada en el servicio.
	 * @param unit Identificador textual de la unidad.
	 */
	translateUnit(unit?: string): string {
		if (!unit) return ''
		const key = unit === 'unidades' ? 'shopping.unit.units_val' : `shopping.unit.${unit}`
		return this.translationService.translate(key) || unit
	}

	/**
	 * Agrega un nuevo ingrediente manual a la lista de compras del usuario y resetea las señales del formulario.
	 */
	addManual(): void {
		const name = this.manualName().trim()
		if (!name) return
		const qty = parseFloat(this.manualQuantity())
		this.list.addManual(name, isNaN(qty) ? undefined : qty, this.manualUnit().trim() || undefined)
		this.manualName.set('')
		this.manualQuantity.set('')
		this.manualUnit.set('')
	}

	/**
	 * Tacha o destacha el artículo indicado.
	 * @param key Identificador único del ingrediente.
	 */
	toggleItem(key: string): void {
		this.list.toggleItem(key)
	}

	/**
	 * Elimina por completo todos los ingredientes agrupados bajo una receta específica.
	 * @param recipeId Identificador único de la receta.
	 */
	removeGroup(recipeId: string): void {
		this.list.removeRecipe(recipeId)
		this.toast.info(this.translationService.translate('shopping.toast.group_removed'))
	}

	/**
	 * Limpia y purga de la lista todos los artículos tachados/comprados.
	 */
	clearChecked(): void {
		this.list.clearChecked()
		this.toast.info(this.translationService.translate('shopping.toast.checked_removed'))
	}

	/**
	 * Borra y limpia de forma completa la lista de compras completa.
	 */
	clearAll(): void {
		this.list.clearAll()
		this.confirmClear.set(false)
		this.toast.info(this.translationService.translate('shopping.toast.list_cleared'))
	}

	/**
	 * Despliega la ventana modal de supermercados online para buscar el ingrediente indicado.
	 * @param searchTerm Nombre del ingrediente.
	 */
	openStoreModal(searchTerm: string): void {
		this.storeModalSearch.set(searchTerm)
		this.storeModalStores.set(this.buildStores(searchTerm))
	}

	/**
	 * Oculta la ventana modal de supermercados online.
	 */
	closeStoreModal(): void {
		this.storeModalSearch.set(null)
		this.storeModalStores.set([])
	}

	/**
	 * Resuelve las siglas del país en base a la configuración regional del navegador para segmentar supermercados nacionales.
	 */
	private detectCountry(): string {
		const lang = navigator.language ?? 'es-ES'
		const parts = lang.split('-')
		return (parts.length > 1 ? parts[1] : parts[0]).toUpperCase()
	}

	/**
	 * Construye los enlaces directos parametrizados para los supermercados correspondientes al país detectado.
	 * @param searchTerm Nombre del artículo a buscar.
	 */
	private buildStores(searchTerm: string): StoreOption[] {
		const q = encodeURIComponent(searchTerm)
		const country = this.detectCountry()

		const byCountry: Record<string, StoreOption[]> = {
			ES: [
				{ name: 'Mercadona',  url: `https://tienda.mercadona.es/search-results?query=${q}`,                             logoSvg: SVG.Mercadona },
				{ name: 'Carrefour',  url: `https://www.carrefour.es/search?query=${q}`,                                        logoSvg: SVG.Carrefour },
				{ name: 'Hipercor',   url: `https://www.hipercor.es/buscar?q=${q}`,                                             logoSvg: SVG.Hipercor  },
				{ name: 'Día',        url: `https://www.dia.es/buscar?q=${q}`,                                                  logoSvg: SVG.Día       },
				{ name: 'Aldi',       url: `https://www.aldi.es/search?query=${q}`,                                             logoSvg: SVG.Aldi      },
				{ name: 'Amazon',     url: `https://www.amazon.es/s?k=${q}&i=grocery`,                                          logoSvg: SVG.Amazon    },
			],
			DE: [
				{ name: 'Rewe',   url: `https://shop.rewe.de/productList?search=${q}`,            logoSvg: SVG.Rewe   },
				{ name: 'Penny',  url: `https://www.penny.de/sortiment?search=${q}`,              logoSvg: SVG.Penny  },
				{ name: 'Aldi',   url: `https://www.aldi.de/unsere-produkte.html?q=${q}`,         logoSvg: SVG.Aldi   },
				{ name: 'Lidl',   url: `https://www.lidl.de/search?q=${q}`,                       logoSvg: SVG.Lidl   },
				{ name: 'Amazon', url: `https://www.amazon.de/s?k=${q}&i=grocery`,                logoSvg: SVG.Amazon },
			],
			FR: [
				{ name: 'Carrefour', url: `https://www.carrefour.fr/search?query=${q}`,           logoSvg: SVG.Carrefour },
				{ name: 'Leclerc',   url: `https://www.e.leclerc/cat/recherche?text=${q}`,        logoSvg: SVG.Leclerc   },
				{ name: 'Auchan',    url: `https://www.auchan.fr/recherche?query=${q}`,           logoSvg: SVG.Auchan    },
				{ name: 'Amazon',    url: `https://www.amazon.fr/s?k=${q}&i=grocery`,             logoSvg: SVG.Amazon    },
			],
			GB: [
				{ name: 'Tesco',       url: `https://www.tesco.com/groceries/en-GB/search?query=${q}`,                      logoSvg: SVG.Tesco          },
				{ name: "Sainsbury's", url: `https://www.sainsburys.co.uk/gol-ui/SearchDisplayView?filters[keyword]=${q}`,  logoSvg: SVG["Sainsbury's"] },
				{ name: 'Asda',        url: `https://groceries.asda.com/search/${q}`,                                       logoSvg: SVG.Asda           },
				{ name: 'Amazon',      url: `https://www.amazon.co.uk/s?k=${q}&i=grocery`,                                  logoSvg: SVG.Amazon         },
			],
		}

		return byCountry[country] ?? byCountry['ES']
	}

	/**
	 * Lanza el diálogo nativo para compartir el texto detallado de la lista o, si no está disponible, lo copia al portapapeles.
	 */
	async share(): Promise<void> {
		const text = this.list.buildShareText()
		if (navigator.share) {
			try {
				const shareTitle = this.translationService.translate('shopping.share_title')
				await navigator.share({ title: shareTitle, text })
			} catch { /* usuario canceló */ }
		} else {
			await navigator.clipboard.writeText(text)
			this.toast.success(this.translationService.translate('shopping.toast.list_copied'))
		}
	}
}
