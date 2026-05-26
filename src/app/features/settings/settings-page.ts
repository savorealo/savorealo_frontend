import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { AuthStore } from '@core/store/auth.store'
import { PreferencesService } from '@core/services/preferences.service'
import { SettingsService, UserSettings } from '@core/services/settings.service'
import { ToastService } from '@core/services/toast.service'
import { TranslationService, LanguageCode } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'

interface SettingsToggle {
	key: keyof Pick<UserSettings, 'notify_likes' | 'notify_comments' | 'notify_follows' | 'is_private'>
	labelKey: string
	descKey: string
}

@Component({
	selector: 'app-settings-page',
	imports: [AppShell, FormsModule, RouterLink, TranslatePipe],
	templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
	private readonly auth = inject(AuthStore)
	private readonly settingsService = inject(SettingsService)
	private readonly toast = inject(ToastService)
	readonly preferences = inject(PreferencesService)
	readonly translationService = inject(TranslationService)

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
			labelKey: 'settings.notifications.likes.label',
			descKey: 'settings.notifications.likes.desc',
		},
		{
			key: 'notify_comments',
			labelKey: 'settings.notifications.comments.label',
			descKey: 'settings.notifications.comments.desc',
		},
		{
			key: 'notify_follows',
			labelKey: 'settings.notifications.follows.label',
			descKey: 'settings.notifications.follows.desc',
		},
	]

	ngOnInit(): void {
		this.settingsService.loadSettings().subscribe({
			next: s => {
				this.settings.set(s)
				if (s.language) {
					this.translationService.setLanguage(s.language as LanguageCode)
				}
			},
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

	changeLanguage(lang: string): void {
		const language = lang as LanguageCode
		this.translationService.setLanguage(language)
		this.persist({ language })
	}

	private persist(patch: Partial<UserSettings>): void {
		this.settings.update(s => ({ ...s, ...patch }))
		if (this.saving()) return
		this.saving.set(true)
		this.settingsService.saveSettings(patch).subscribe({
			next: () => this.saving.set(false),
			error: () => {
				this.saving.set(false)
				this.toast.error(this.translationService.translate('settings.error_save'))
			},
		})
	}

	logOut(): void {
		this.auth.logout()
	}
}
