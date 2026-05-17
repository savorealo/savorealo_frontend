import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'savorealo:theme'
const DARK_ATTR = 'dark'
const LIGHT_ATTR = 'light'

/**
 * Gestiona el tema visual de la aplicación.
 *
 * Reglas:
 *  - `auto`  → se sigue `prefers-color-scheme` del sistema operativo.
 *  - `light` / `dark` → preferencia explícita del usuario (gana siempre).
 *
 * La preferencia se persiste en `localStorage` con la clave `savorealo:theme`.
 * El tema resuelto se aplica como atributo `data-theme` en `<html>`.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
	private readonly platformId = inject(PLATFORM_ID)
	private readonly isBrowser = isPlatformBrowser(this.platformId)

	private readonly _mode = signal<ThemeMode>('auto')
	private readonly _systemPrefersDark = signal<boolean>(false)

	/** Modo elegido por el usuario (puede ser `auto`). */
	readonly mode = this._mode.asReadonly()

	/** Tema realmente aplicado en pantalla (resuelve `auto` al valor del sistema). */
	readonly resolvedTheme = computed<ResolvedTheme>(() => {
		const mode = this._mode()
		if (mode === 'auto') return this._systemPrefersDark() ? 'dark' : 'light'
		return mode
	})

	/** Helper rápido para botones tipo toggle. */
	readonly isDark = computed(() => this.resolvedTheme() === 'dark')

	constructor() {
		if (this.isBrowser) {
			this.hydrateFromStorage()
			this.observeSystemPreference()
			effect(() => this.applyToDocument(this.resolvedTheme(), this._mode()))
		}
	}

	/** Cambia el modo y persiste la decisión. */
	setMode(mode: ThemeMode): void {
		this._mode.set(mode)
		if (!this.isBrowser) return
		if (mode === 'auto') {
			localStorage.removeItem(STORAGE_KEY)
		} else {
			localStorage.setItem(STORAGE_KEY, mode)
		}
	}

	/** Alterna entre claro y oscuro (rompe `auto`). */
	toggle(): void {
		this.setMode(this.isDark() ? 'light' : 'dark')
	}

	private hydrateFromStorage(): void {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored === 'light' || stored === 'dark') {
			this._mode.set(stored)
		} else {
			this._mode.set('auto')
		}
	}

	private observeSystemPreference(): void {
		const query = window.matchMedia('(prefers-color-scheme: dark)')
		this._systemPrefersDark.set(query.matches)
		query.addEventListener('change', event => this._systemPrefersDark.set(event.matches))
	}

	private applyToDocument(resolved: ResolvedTheme, mode: ThemeMode): void {
		const root = document.documentElement
		if (mode === 'auto') {
			// Sin preferencia explícita → dejamos que el CSS responda a prefers-color-scheme
			root.removeAttribute('data-theme')
		} else {
			root.setAttribute('data-theme', resolved === 'dark' ? DARK_ATTR : LIGHT_ATTR)
		}
		root.style.colorScheme = resolved
	}
}
