import { Component, inject, input, OnInit, output, computed } from '@angular/core'
import { RouterLink, RouterLinkActive }              from '@angular/router'
import { AuthStore }                                 from '@core/store/auth.store'
import { NotificationsStore }                        from '@core/store/notifications.store'
import { GlobalSearchStore }                         from '@core/store/global-search.store'
import { GlobalSearchPanel }                         from '@shared/components/global-search/global-search-panel'
import { Topbar }                                    from '@shared/components/topbar/topbar'
import { CallHost }                                  from '@shared/components/call-host/call-host'
import { ShoppingListService }                       from '@features/shopping-list/shopping-list.service'
import { TranslatePipe }                             from '@shared/pipes/translate.pipe'

/**
 * Estructura que define cada elemento individual dentro del sistema de navegación del AppShell.
 */
interface ShellNavItem {
	/**
	 * Nombre de la clase del icono de PrimeIcons para renderizar visualmente la opción.
	 */
	icon: string

	/**
	 * Clave de traducción que mapea el texto descriptivo en diferentes idiomas.
	 */
	labelKey: string

	/**
	 * Enlace o ruta de navegación interna de Angular.
	 */
	route: string
}

/**
 * Componente contenedor estructural (App Shell) de la aplicación.
 * Proporciona el layout base con barra de navegación lateral para escritorio, barra inferior para móviles,
 * barra de búsqueda y soporte de recepción de notificaciones y videollamadas globales.
 */
@Component({
	selector: 'app-shell',
	imports: [RouterLink, RouterLinkActive, GlobalSearchPanel, Topbar, CallHost, TranslatePipe],
	templateUrl: './app-shell.html',
	styles: [`
		@keyframes logo-roll-in {
			from { transform: translateX(calc(100vw - 200px)) rotate(0deg); }
			to   { transform: translateX(0) rotate(-3240deg); }
		}
		.logo-roll-in {
			animation: logo-roll-in 2.8s cubic-bezier(0.25, 0, 0.35, 1) both;
			position: relative;
			z-index: 9999;
		}
	`],
})
export class AppShell implements OnInit {
	/**
	 * Almacén de estado de autenticación de la aplicación.
	 */
	readonly authStore = inject(AuthStore)

	/**
	 * Almacén de estado de notificaciones.
	 */
	readonly notifications = inject(NotificationsStore)

	/**
	 * Almacén de estado de la búsqueda global interactiva.
	 */
	readonly globalSearch   = inject(GlobalSearchStore)

	/**
	 * Servicio para la lista de compras local y remota.
	 */
	readonly shoppingList   = inject(ShoppingListService)

	/**
	 * Señal derivada con los datos de perfil del usuario en línea.
	 */
	readonly profile    = this.authStore.profile

	/**
	 * Dirección URL de la imagen del logotipo corporativo de Savorealo.
	 */
	readonly logoUrl    = '/assets/icons/new_logo.png'

	/**
	 * Entrada que controla si se debe renderizar la barra superior global. Por defecto es true.
	 */
	readonly showTopbar = input(true)

	/**
	 * Emisor de evento que notifica cuando se pulsa el botón flotante de creación.
	 */
	readonly create     = output<void>()

	/**
	 * Configuración del menú de navegación lateral en pantallas de escritorio.
	 */
	readonly navItems = computed<ShellNavItem[]>(() => {
		const items: ShellNavItem[] = [
			{ icon: 'pi pi-home',          labelKey: 'shell.feed',          route: '/' },
			{ icon: 'pi pi-search',        labelKey: 'shell.explore',       route: '/explore' },
			{ icon: 'pi pi-map-marker',    labelKey: 'shell.places',        route: '/places' },
			{ icon: 'pi pi-sparkles',      labelKey: 'shell.ai_recipes',    route: '/ai' },
			{ icon: 'pi pi-bookmark',      labelKey: 'shell.saved',         route: '/saved' },
			{ icon: 'pi pi-comments',      labelKey: 'shell.messages',      route: '/chat' },
			{ icon: 'pi pi-bell',          labelKey: 'shell.notifications', route: '/notifications' },
			{ icon: 'pi pi-shopping-cart', labelKey: 'shell.shopping',      route: '/shopping' },
			{ icon: 'pi pi-cog',           labelKey: 'shell.settings',      route: '/settings' },
		];
		// Solo mostramos la pestaña de admin a usuarios administradores
		if (this.authStore.isAdmin()) {
			items.push({ icon: 'pi pi-shield', labelKey: 'shell.admin_panel', route: '/admin' });
		}
		return items;
	});

	/**
	 * Configuración simplificada de navegación para la barra inferior (tabbar) en pantallas de móviles.
	 */
	readonly mobileNavItems: ShellNavItem[] = [
		{ icon: 'pi pi-home',          labelKey: 'shell.feed',     route: '/' },
		{ icon: 'pi pi-search',        labelKey: 'shell.explore',  route: '/explore' },
		{ icon: 'pi pi-map-marker',    labelKey: 'shell.places',   route: '/places' },
		{ icon: 'pi pi-comments',      labelKey: 'shell.chats',    route: '/chat' },
		{ icon: 'pi pi-user',          labelKey: 'shell.profile',  route: '/profile' },
	]

	/**
	 * Al inicializar el componente, activa la carga asíncrona de las notificaciones actuales del usuario.
	 */
	ngOnInit(): void {
		this.notifications.load()
	}

	/**
	 * Ejecuta el proceso de cierre de sesión del usuario en el almacén de autenticación.
	 */
	logout(): void {
		this.authStore.logout()
	}
}
