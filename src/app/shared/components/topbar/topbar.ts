import { Component, inject, output } from '@angular/core'
import { RouterLink }               from '@angular/router'
import { AuthStore }                from '@core/store/auth.store'
import { GlobalSearchStore }        from '@core/store/global-search.store'
import { NotificationsStore }       from '@core/store/notifications.store'

import { TranslatePipe }              from '@shared/pipes/translate.pipe'

/**
 * Componente de barra superior de navegación global de la aplicación.
 * Muestra el logotipo de la marca, los accesos directos de búsqueda, accesos de notificaciones y perfil de usuario.
 */
@Component({
	selector: 'app-topbar',
	imports: [RouterLink, TranslatePipe],
	templateUrl: './topbar.html',
})
export class Topbar {
	/**
	 * Almacén de estado de autenticación.
	 */
	private readonly auth  = inject(AuthStore)

	/**
	 * Almacén de estado de búsqueda global.
	 */
	readonly globalSearch  = inject(GlobalSearchStore)

	/**
	 * Almacén de estado de notificaciones.
	 */
	readonly notifications = inject(NotificationsStore)

	/**
	 * Señal del perfil de usuario autenticado.
	 */
	readonly profile = this.auth.profile

	/**
	 * URL estática que apunta al recurso del logotipo de la aplicación.
	 */
	readonly logoUrl = '/assets/icons/new_logo.png'

	/**
	 * Emisor de evento que se dispara al solicitar crear un nuevo elemento/receta.
	 */
	create = output<void>()
}
