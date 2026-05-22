import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { ThemeService } from '@core/services/theme.service'
import { SETTINGS_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

export interface UserSettings {
	is_private: boolean
	notify_likes: boolean
	notify_comments: boolean
	notify_follows: boolean
	theme: 'light' | 'dark'
	language: string
}

const DEFAULTS: UserSettings = {
	is_private: false,
	notify_likes: true,
	notify_comments: true,
	notify_follows: true,
	theme: 'light',
	language: 'es',
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
	private readonly repo = inject(SETTINGS_REPOSITORY)
	private readonly theme = inject(ThemeService)

	loadSettings(): Observable<UserSettings> {
		return this.repo.loadSettings().pipe(
			map(row => {
				const settings: UserSettings = row ? this.normalize(row) : { ...DEFAULTS }
				this.applyTheme(settings.theme)
				return settings
			}),
		)
	}

	saveSettings(patch: Partial<UserSettings>): Observable<void> {
		return this.repo.saveSettings(patch)
	}

	applyTheme(theme: 'light' | 'dark'): void {
		this.theme.setMode(theme)
	}

	private normalize(row: { is_private: boolean; language: string; theme: string; notify_likes: boolean; notify_comments: boolean; notify_follows: boolean }): UserSettings {
		return {
			is_private:       row.is_private,
			language:         row.language || DEFAULTS.language,
			theme:            row.theme === 'dark' ? 'dark' : 'light',
			notify_likes:     row.notify_likes,
			notify_comments:  row.notify_comments,
			notify_follows:   row.notify_follows,
		}
	}
}
