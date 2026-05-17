import { Component, inject, OnInit } from '@angular/core'
import { RouterLink, RouterLinkActive } from '@angular/router'
import { AuthStore } from '@core/store/auth.store'
import { NotificationsStore } from '@core/store/notifications.store'
import { GlobalSearchStore } from '@core/store/global-search.store'
import { GlobalSearchPanel } from '@shared/components/global-search/global-search-panel'
import { ThemeService } from '@core/services/theme.service'

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
	readonly theme          = inject(ThemeService)

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

	readonly mobileNavItems: ShellNavItem[] = [
		{ icon: 'pi pi-home', label: 'Feed', route: '/' },
		{ icon: 'pi pi-search', label: 'Explorar', route: '/explore' },
		{ icon: 'pi pi-sparkles', label: 'IA', route: '/ai' },
		{ icon: 'pi pi-comments', label: 'Chats', route: '/chat' },
		{ icon: 'pi pi-user', label: 'Perfil', route: '/profile' },
	]

	ngOnInit(): void {
		this.notifications.load()
	}

	toggleTheme(): void {
		this.theme.toggle()
	}

	logout(): void {
		this.authStore.logout()
	}
}
