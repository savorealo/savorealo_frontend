import { Component, inject, input, OnInit, output } from '@angular/core'
import { RouterLink, RouterLinkActive }              from '@angular/router'
import { AuthStore }                                 from '@core/store/auth.store'
import { NotificationsStore }                        from '@core/store/notifications.store'
import { GlobalSearchStore }                         from '@core/store/global-search.store'
import { GlobalSearchPanel }                         from '@shared/components/global-search/global-search-panel'
import { ThemeService }                              from '@core/services/theme.service'
import { Topbar }                                    from '@shared/components/topbar/topbar'

interface ShellNavItem {
	icon: string
	label: string
	route: string
}

@Component({
	selector: 'app-shell',
	imports: [RouterLink, RouterLinkActive, GlobalSearchPanel, Topbar],
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
	private readonly authStore = inject(AuthStore)
	readonly notifications = inject(NotificationsStore)
	readonly globalSearch   = inject(GlobalSearchStore)
	readonly theme          = inject(ThemeService)

	readonly profile    = this.authStore.profile
	readonly logoUrl    = '/assets/icons/new_logo.png'
	readonly showTopbar = input(true)
	readonly create     = output<void>()

	readonly navItems: ShellNavItem[] = [
		{ icon: 'pi pi-home',       label: 'Feed',          route: '/' },
		{ icon: 'pi pi-search',     label: 'Explorar',      route: '/explore' },
		{ icon: 'pi pi-map-marker', label: 'Lugares',       route: '/places' },
		{ icon: 'pi pi-sparkles',   label: 'IA Recetas',    route: '/ai' },
		{ icon: 'pi pi-bookmark',   label: 'Guardados',     route: '/saved' },
		{ icon: 'pi pi-comments',   label: 'Mensajes',      route: '/chat' },
		{ icon: 'pi pi-bell',       label: 'Notificaciones',route: '/notifications' },
		{ icon: 'pi pi-cog',        label: 'Ajustes',       route: '/settings' },
	]

	readonly mobileNavItems: ShellNavItem[] = [
		{ icon: 'pi pi-home',       label: 'Feed',    route: '/' },
		{ icon: 'pi pi-search',     label: 'Explorar',route: '/explore' },
		{ icon: 'pi pi-map-marker', label: 'Lugares', route: '/places' },
		{ icon: 'pi pi-comments',   label: 'Chats',   route: '/chat' },
		{ icon: 'pi pi-user',       label: 'Perfil',  route: '/profile' },
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
