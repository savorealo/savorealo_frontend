import { Component, inject, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { AuthStore } from '@core/store/auth.store'
import { Avatar } from "../avatar/avatar";

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    Avatar
],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {
  private authStore = inject(AuthStore)

  profile  = this.authStore.profile
  expanded = signal(false)

  navItems = [
    { icon: 'pi pi-home',    label: 'Inicio',    route: '/',    ai: false },
    { icon: 'pi pi-compass', label: 'Explorar',  route: '/explore', ai: false },
    { icon: 'pi pi-comments',label: 'Chat',      route: '/chat',    ai: false },
    { icon: 'pi pi-user',    label: 'Perfil',    route: '/profile', ai: false },
    { icon: 'pi pi-sparkles',label: 'Let me cook',route: '/ai',     ai: true  },
  ]

  expand()   { this.expanded.set(true)  }
  collapse() { this.expanded.set(false) }

  logout() { this.authStore.logout() }
}
