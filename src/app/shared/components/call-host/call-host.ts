import { Component, effect, inject } from '@angular/core'
import { AuthStore } from '@core/store/auth.store'
import { CallStore } from '@core/store/call.store'
import { CallOverlay } from '@features/messages/components/call-overlay/call-overlay'
import { IncomingCall } from '@features/messages/components/incoming-call/incoming-call'

/**
 * Componente contenedor global para gestionar la señalización y superposiciones (overlays) de videollamadas WebRTC.
 * Se encarga de suscribir y desuscribir al usuario autenticado de los canales en tiempo real.
 */
@Component({
	selector: 'app-call-host',
	imports: [IncomingCall, CallOverlay],
	template: `
		<app-incoming-call />
		<app-call-overlay />
	`,
})
export class CallHost {
	/**
	 * Almacén de estado de autenticación de usuario.
	 */
	private readonly auth = inject(AuthStore)

	/**
	 * Almacén de estado que centraliza las funciones y el estado de la llamada.
	 */
	private readonly calls = inject(CallStore)

	/**
	 * Inicializa el componente.
	 * Utiliza un efecto reactivo para suscribirse a los eventos de llamadas si hay un usuario autenticado, o desuscribirse en caso contrario.
	 */
	constructor() {
		effect(() => {
			const userId = this.auth.currentUserId()
			if (userId) {
				this.calls.subscribeForCurrentUser()
			} else {
				this.calls.unsubscribeAll()
			}
		})
	}
}
