import { inject, Injectable, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { from, map, Observable, of, switchMap } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'

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
	private readonly supabase = inject(SupabaseService)
	private readonly platformId = inject(PLATFORM_ID)

	loadSettings(): Observable<UserSettings> {
		return from(this.supabase.client.auth.getUser()).pipe(
			switchMap(({ data }) => {
				const userId = data.user?.id
				if (!userId) return of({ ...DEFAULTS })
				return from(
					this.supabase.client
						.from('user_settings')
						.select('is_private, notify_likes, notify_comments, notify_follows, theme, language')
						.eq('user_id', userId)
						.maybeSingle(),
				).pipe(
					map(({ data: row }) => {
						const settings: UserSettings = row ? { ...DEFAULTS, ...row } : { ...DEFAULTS }
						this.applyTheme(settings.theme)
						return settings
					}),
				)
			}),
		)
	}

	saveSettings(settings: Partial<UserSettings>): Observable<void> {
		return from(this.supabase.client.auth.getUser()).pipe(
			switchMap(({ data }) => {
				const userId = data.user?.id
				if (!userId) throw new Error('No hay sesión activa')
				return from(
					this.supabase.client
						.from('user_settings')
						.upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' }),
				)
			}),
			map(({ error }) => {
				if (error) throw error
			}),
		)
	}

	applyTheme(theme: 'light' | 'dark'): void {
		if (!isPlatformBrowser(this.platformId)) return
		if (theme === 'dark') {
			document.documentElement.setAttribute('data-theme', 'dark')
		} else {
			document.documentElement.removeAttribute('data-theme')
		}
	}
}
