import { Component, inject, OnInit } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { AuthStore } from '@core/store/auth.store'
import { NotificationsStore } from '@core/store/notifications.store'
import { GlobalSearchStore } from '@core/store/global-search.store'
import { GlobalSearchPanel } from '@shared/components/global-search/global-search-panel'

interface ShellNavItem {
	icon: string
	label: string
	route: string
}

@Component({
	selector: 'app-shell',
	imports: [RouterLink, RouterLinkActive, GlobalSearchPanel],
	templateUrl: './app-shell.html',
})
export class AppShell implements OnInit {
	private readonly authStore = inject(AuthStore)
	readonly notifications = inject(NotificationsStore)
	readonly globalSearch   = inject(GlobalSearchStore)

	readonly profile = this.authStore.profile
	readonly logoUrl = '/assets/icons/new_logo.png'

	readonly navItems: ShellNavItem[] = [
		{ icon: 'pi pi-home', label: 'Feed', route: '/' },
		{ icon: 'pi pi-search', label: 'Explorar', route: '/explore' },
		{ icon: 'pi pi-sparkles', label: 'IA Recetas', route: '/ai' },
		{ icon: 'pi pi-bookmark', label: 'Guardados', route: '/saved' },
		{ icon: 'pi pi-comments', label: 'Mensajes', route: '/chat' },
		{ icon: 'pi pi-bell', label: 'Notificaciones', route: '/notifications' },
		{ icon: 'pi pi-cog', label: 'Ajustes', route: '/settings' },
	]

	ngOnInit(): void {
		this.notifications.load()
	}

	logout(): void {
		this.authStore.logout()
	}
}
