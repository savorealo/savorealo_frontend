import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { from, map, Observable } from 'rxjs'
import { ThemeService } from '@core/services/theme.service'
import { MY_SETTINGS_QUERY, UPDATE_SETTINGS_MUTATION } from '@graphql/feed.mutations'

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

interface GqlUserSettings {
	is_private: boolean
	language: string
	theme: string
	notify_likes: boolean
	notify_comments: boolean
	notify_follows: boolean
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
	private readonly apollo = inject(Apollo)
	private readonly theme = inject(ThemeService)

	loadSettings(): Observable<UserSettings> {
		return from(
			this.apollo.query<{ mySettings: GqlUserSettings | null }>({
				query: MY_SETTINGS_QUERY,
				fetchPolicy: 'network-only',
			}).toPromise(),
		).pipe(
			map(res => {
				const row = res?.data?.mySettings
				const settings: UserSettings = row ? this.normalize(row) : { ...DEFAULTS }
				this.applyTheme(settings.theme)
				return settings
			}),
		)
	}

	saveSettings(patch: Partial<UserSettings>): Observable<void> {
		return from(
			this.apollo.mutate<{ updateSettings: GqlUserSettings }>({
				mutation: UPDATE_SETTINGS_MUTATION,
				variables: {
					is_private:       patch.is_private,
					language:         patch.language,
					theme:            patch.theme,
					notify_likes:     patch.notify_likes,
					notify_comments:  patch.notify_comments,
					notify_follows:   patch.notify_follows,
				},
			}).toPromise(),
		).pipe(map(() => void 0))
	}

	/**
	 * Delegación al `ThemeService` para mantener una única fuente de verdad.
	 * Mantenido aquí por compatibilidad con código existente que ya llamaba
	 * `settingsService.applyTheme(...)`.
	 */
	applyTheme(theme: 'light' | 'dark'): void {
		this.theme.setMode(theme)
	}

	private normalize(row: GqlUserSettings): UserSettings {
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
