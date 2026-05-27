import { inject, Injectable } from '@angular/core'
import { map, Observable } from 'rxjs'
import { ThemeService } from '@core/services/theme.service'
import { SETTINGS_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

/**
 * Interfaz que define la estructura o contrato de datos para usersettings.
 */
export interface UserSettings {
	/**
	 * Indicador booleano para es o está private.
	 */
	is_private: boolean
	/**
	 * Propiedad para gestionar notify likes.
	 */
	notify_likes: boolean
	/**
	 * Propiedad para gestionar notify comments.
	 */
	notify_comments: boolean
	/**
	 * Propiedad para gestionar notify follows.
	 */
	notify_follows: boolean
	/**
	 * Propiedad para gestionar theme.
	 */
	theme: 'light' | 'dark'
	/**
	 * Propiedad para gestionar language.
	 */
	language: string
}

/**
 * Variable o constante para d e f a u l t s.
 */
const DEFAULTS: UserSettings = {
	is_private: false,
	notify_likes: true,
	notify_comments: true,
	notify_follows: true,
	theme: 'light',
	language: 'es',
}

/**
 * Servicio que provee la lógica de negocio para settings.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
	/**
	 * Propiedad para gestionar repo.
	 */
	private readonly repo = inject(SETTINGS_REPOSITORY)
	/**
	 * Propiedad para gestionar theme.
	 */
	private readonly theme = inject(ThemeService)

	/**
	 * Método para cargar settings.
	 */
	loadSettings(): Observable<UserSettings> {
		return this.repo.loadSettings().pipe(
			map(row => {
				const settings: UserSettings = row ? this.normalize(row) : { ...DEFAULTS }
				this.applyTheme(settings.theme)
				return settings
			}),
		)
	}

	/**
	 * Método para guardar settings.
	 */
	saveSettings(patch: Partial<UserSettings>): Observable<void> {
		return this.repo.saveSettings(patch)
	}

	/**
	 * Método para apply theme.
	 */
	applyTheme(theme: 'light' | 'dark'): void {
		this.theme.setMode(theme)
	}

	/**
	 * Método para normalize.
	 */
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
