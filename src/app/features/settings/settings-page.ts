import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { AuthStore } from '@core/store/auth.store'
import { SettingsService, UserSettings } from '@core/services/settings.service'
import { ToastService } from '@core/services/toast.service'

interface SettingsToggle {
	key: keyof Pick<UserSettings, 'notify_likes' | 'notify_comments' | 'notify_follows' | 'is_private'>
	label: string
	description: string
}

@Component({
	selector: 'app-settings-page',
	imports: [AppShell, FormsModule, RouterLink],
	templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
	private readonly auth = inject(AuthStore)
	private readonly settingsService = inject(SettingsService)
	private readonly toast = inject(ToastService)

	readonly profile = this.auth.profile
	readonly logoUrl = '/assets/icons/new_logo.png'
	readonly saving = signal(false)

	readonly displayName = computed(() => this.profile()?.fullName || this.profile()?.username || 'Chef Savorealo')
	readonly username = computed(() => this.profile()?.username || 'usuario')
	readonly email = computed(() => this.profile()?.email || 'Sin email')

	readonly settings = signal<UserSettings>({
		is_private: false,
		notify_likes: true,
		notify_comments: true,
		notify_follows: true,
		theme: 'light',
		language: 'es',
	})

	readonly isDark = computed(() => this.settings().theme === 'dark')

	readonly notificationToggles: SettingsToggle[] = [
		{
			key: 'notify_likes',
			label: 'Likes',
			description: 'Avisame cuando alguien le de like a tu receta o post.',
		},
		{
			key: 'notify_comments',
			label: 'Comentarios',
			description: 'Avisame cuando alguien comente una receta o post.',
		},
		{
			key: 'notify_follows',
			label: 'Nuevos seguidores',
			description: 'Muestra notificaciones cuando otros cocineros te sigan.',
		},
	]

	ngOnInit(): void {
		this.settingsService.loadSettings().subscribe({
			next: s => this.settings.set(s),
		})
	}

	toggle(key: SettingsToggle['key']): void {
		this.persist({ [key]: !this.settings()[key] })
	}

	toggleTheme(): void {
		const next = this.isDark() ? 'light' : 'dark'
		this.settingsService.applyTheme(next)
		this.persist({ theme: next })
	}

	togglePrivacy(): void {
		this.persist({ is_private: !this.settings().is_private })
	}

	private persist(patch: Partial<UserSettings>): void {
		this.settings.update(s => ({ ...s, ...patch }))
		if (this.saving()) return
		this.saving.set(true)
		this.settingsService.saveSettings(patch).subscribe({
			next: () => this.saving.set(false),
			error: () => {
				this.saving.set(false)
				this.toast.error('No se pudieron guardar los ajustes')
			},
		})
	}

	logOut(): void {
		this.auth.logout()
	}
}
