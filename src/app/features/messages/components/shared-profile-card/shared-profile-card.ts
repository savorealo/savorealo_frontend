import { Component, computed, inject, input, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PublicUser, UserService } from '@core/services/user.service'
import { User } from '@core/models/user/User'
import { Avatar } from '@shared/components/avatar/avatar'

/**
 * Clase de utilidad para sharedprofilecard.
 */
@Component({
	selector: 'app-shared-profile-card',
	imports: [Avatar, RouterLink],
	templateUrl: './shared-profile-card.html',
})
export class SharedProfileCard implements OnInit {
	/**
	 * Propiedad para gestionar users.
	 */
	private readonly users = inject(UserService)

	/**
	 * Propiedad para gestionar user identificador.
	 */
	userId = input<string | null>(null)
	/**
	 * Propiedad para gestionar nombre de usuario.
	 */
	username = input<string | null>(null)

	/**
	 * Propiedad para gestionar user.
	 */
	readonly user = signal<(User & Partial<PublicUser>) | null>(null)
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading = signal(true)
	/**
	 * Propiedad para gestionar failed.
	 */
	readonly failed = signal(false)

	/**
	 * Propiedad para gestionar display nombre.
	 */
	readonly displayName = computed(() => this.user()?.fullName || this.user()?.username || this.username() || 'Perfil')
	/**
	 * Propiedad para gestionar gestionar.
	 */
	readonly handle = computed(() => this.user()?.username || this.username() || '')
	/**
	 * Propiedad para gestionar profile enlace.
	 */
	readonly profileLink = computed(() => this.handle() ? ['/profile', this.handle()] : ['/profile'])
	/**
	 * Indicador booleano para es o está locked.
	 */
	readonly isLocked = computed(() => !!this.user()?.isPrivate && this.user()?.isViewable === false)

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
	ngOnInit(): void {
		const username = this.username()
		const userId = this.userId()

		if (username) {
			this.users.getUserByUsername(username).subscribe({
				next: user => {
					this.user.set(user)
					this.loading.set(false)
					this.failed.set(!user)
				},
				error: () => this.markFailed(),
			})
			return
		}

		if (userId) {
			this.users.getUserById(userId).subscribe({
				next: result => {
					this.user.set(result.data)
					this.loading.set(false)
				},
				error: () => this.markFailed(),
			})
			return
		}

		this.markFailed()
	}

	/**
	 * Método para mark failed.
	 */
	private markFailed(): void {
		this.loading.set(false)
		this.failed.set(true)
	}
}
