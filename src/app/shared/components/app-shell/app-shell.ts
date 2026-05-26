import { Component, inject, input, OnInit, output } from '@angular/core'
import { RouterLink, RouterLinkActive }              from '@angular/router'
import { AuthStore }                                 from '@core/store/auth.store'
import { NotificationsStore }                        from '@core/store/notifications.store'
import { GlobalSearchStore }                         from '@core/store/global-search.store'
import { GlobalSearchPanel }                         from '@shared/components/global-search/global-search-panel'
import { Topbar }                                    from '@shared/components/topbar/topbar'
import { CallHost }                                  from '@shared/components/call-host/call-host'
import { ShoppingListService }                       from '@features/shopping-list/shopping-list.service'
import { TranslatePipe }                             from '@shared/pipes/translate.pipe'

interface ShellNavItem {
	icon: string
	labelKey: string
	route: string
}

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
	private readonly authStore = inject(AuthStore)
	readonly notifications = inject(NotificationsStore)
	readonly globalSearch   = inject(GlobalSearchStore)
	readonly shoppingList   = inject(ShoppingListService)

	readonly profile    = this.authStore.profile
	readonly logoUrl    = '/assets/icons/new_logo.png'
	readonly showTopbar = input(true)
	readonly create     = output<void>()

	readonly navItems: ShellNavItem[] = [
		{ icon: 'pi pi-home',          labelKey: 'shell.feed',          route: '/' },
		{ icon: 'pi pi-search',        labelKey: 'shell.explore',       route: '/explore' },
		{ icon: 'pi pi-map-marker',    labelKey: 'shell.places',        route: '/places' },
		{ icon: 'pi pi-sparkles',      labelKey: 'shell.ai_recipes',    route: '/ai' },
		{ icon: 'pi pi-bookmark',      labelKey: 'shell.saved',         route: '/saved' },
		{ icon: 'pi pi-comments',      labelKey: 'shell.messages',      route: '/chat' },
		{ icon: 'pi pi-bell',          labelKey: 'shell.notifications', route: '/notifications' },
		{ icon: 'pi pi-shopping-cart', labelKey: 'shell.shopping',      route: '/shopping' },
		{ icon: 'pi pi-cog',           labelKey: 'shell.settings',      route: '/settings' },
	]

	readonly mobileNavItems: ShellNavItem[] = [
		{ icon: 'pi pi-home',          labelKey: 'shell.feed',     route: '/' },
		{ icon: 'pi pi-search',        labelKey: 'shell.explore',  route: '/explore' },
		{ icon: 'pi pi-map-marker',    labelKey: 'shell.places',   route: '/places' },
		{ icon: 'pi pi-comments',      labelKey: 'shell.chats',    route: '/chat' },
		{ icon: 'pi pi-user',          labelKey: 'shell.profile',  route: '/profile' },
	]

	ngOnInit(): void {
		this.notifications.load()
	}

	logout(): void {
		this.authStore.logout()
	}
}
