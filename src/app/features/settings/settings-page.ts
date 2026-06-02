import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { AuthStore } from '@core/store/auth.store'
import { PreferencesService } from '@core/services/preferences.service'
import { SettingsService, UserSettings } from '@core/services/settings.service'
import { ToastService } from '@core/services/toast.service'
import { NgIf } from '@angular/common'
import { TranslationService, LanguageCode } from '@core/services/translation.service'
import { TranslatePipe } from '@shared/pipes/translate.pipe'
import { SupabaseService } from '@core/services/supabase.service'

/**
 * Estructura que define un interruptor de configuración (toggle) en la interfaz de ajustes.
 */
interface SettingsToggle {
	/**
	 * Clave del campo de la configuración del usuario a modificar.
	 */
	key: keyof Pick<UserSettings, 'notify_likes' | 'notify_comments' | 'notify_follows' | 'is_private'>
	/**
	 * Clave de traducción para la etiqueta visible de la opción.
	 */
	labelKey: string
	/**
	 * Clave de traducción para la descripción descriptiva debajo de la opción.
	 */
	descKey: string
}

/**
 * Componente que representa la página de Ajustes y Configuración del usuario.
 * Proporciona interruptores de notificaciones, opción de privacidad de la cuenta,
 * cambio interactivo de idioma y tema (claro/oscuro), además de cierre de sesión.
 */
@Component({
	selector: 'app-settings-page',
	imports: [AppShell, FormsModule, RouterLink, TranslatePipe, NgIf],
	templateUrl: './settings-page.html',
})
export class SettingsPage implements OnInit {
	/**
	 * Almacén de estado de autenticación.
	 */
	private readonly auth = inject(AuthStore)

	/**
	 * Servicio para la consulta y persistencia de configuraciones de usuario.
	 */
	private readonly settingsService = inject(SettingsService)

	/**
	 * Servicio toast para retroalimentación visual al guardar.
	 */
	private readonly toast = inject(ToastService)

	/**
	 * Servicio de preferencias inyectado.
	 */
	readonly preferences = inject(PreferencesService)

	/**
	 * Servicio de traducción para internacionalizar la interfaz tras cambiar el idioma.
	 */
	readonly translationService = inject(TranslationService)

	/**
	 * Señal con la información del perfil del usuario autenticado.
	 */
	readonly profile = this.auth.profile

	/**
	 * URL de la imagen del logotipo corporativo de Savorealo.
	 */
	readonly logoUrl = '/assets/icons/new_logo.png'

	/**
	 * Señal reactiva que indica si hay una petición de persistencia en proceso.
	 */
	readonly saving = signal(false)

	/**
	 * Señal calculada con el nombre completo de usuario a mostrar.
	 */
	readonly displayName = computed(() => this.profile()?.fullName || this.profile()?.username || 'Chef Savorealo')

	/**
	 * Señal calculada con el nombre de usuario de perfil del chef.
	 */
	readonly username = computed(() => this.profile()?.username || 'usuario')

	/**
	 * Señal calculada con la dirección de correo registrada.
	 */
	readonly email = computed(() => this.profile()?.email || 'Sin email')

	/**
	 * Señal reactiva local que almacena la configuración de ajustes actual del usuario.
	 */
	readonly settings = signal<UserSettings>({
		is_private: false,
		notify_likes: true,
		notify_comments: true,
		notify_follows: true,
		theme: 'light',
		language: 'es',
	})

	/**
	 * Señal calculada que determina si el tema oscuro de la aplicación está activo.
	 */
	readonly isDark = computed(() => this.settings().theme === 'dark')

	/**
	 * Colección de interruptores visuales de notificaciones configurables por el usuario.
	 */
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

	/**
	 * Al inicializar, recupera los ajustes de configuración guardados del usuario y los aplica.
	 */
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

	/**
	 * Cambia el estado de un interruptor concreto (toggle) de notificaciones y persiste el cambio.
	 * @param key Clave de la propiedad a alternar.
	 */
	toggle(key: SettingsToggle['key']): void {
		this.persist({ [key]: !this.settings()[key] })
	}

	/**
	 * Alterna el tema visual (claro u oscuro) de la aplicación y persiste la selección.
	 */
	toggleTheme(): void {
		const next = this.isDark() ? 'light' : 'dark'
		this.settingsService.applyTheme(next)
		this.persist({ theme: next })
	}

	/**
	 * Alterna el estado de privacidad de la cuenta (público o privado).
	 */
	togglePrivacy(): void {
		this.persist({ is_private: !this.settings().is_private })
	}

	/**
	 * Configura el nuevo idioma del usuario, actualizando el TranslationService local y persistiendo el cambio.
	 * @param lang Identificador del código de idioma (es, en, fr, de).
	 */
	changeLanguage(lang: string): void {
		const language = lang as LanguageCode
		this.translationService.setLanguage(language)
		this.persist({ language })
	}

	/**
	 * Envía las modificaciones parciales de la configuración al servicio para su persistencia en el backend.
	 * @param patch Modificaciones a aplicar en la configuración.
	 */
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

	/**
	 * Cierra la sesión activa del usuario y borra los datos locales.
	 */
	logOut(): void {
		this.auth.logout()
	}

	// ─── Sistema de Tickets y Sugerencias ────────────────────────────────────────

	private readonly supabase = inject(SupabaseService)
	ticketType = 'error'
	ticketTitle = ''
	ticketDescription = ''
	readonly ticketSubmitting = signal(false)
	readonly ticketSuccess = signal(false)
	readonly ticketError = signal<string | null>(null)

	async sendTicket(): Promise<void> {
		if (!this.ticketTitle.trim() || !this.ticketDescription.trim()) return

		this.ticketSubmitting.set(true)
		this.ticketSuccess.set(false)
		this.ticketError.set(null)

		try {
			const { error } = await this.supabase.client
				.from('tickets')
				.insert({
					user_id:     this.profile()?.id,
					type:        this.ticketType,
					title:       this.ticketTitle.trim(),
					description: this.ticketDescription.trim(),
					status:      'open'
				})

			if (error) throw error

			this.ticketSuccess.set(true)
			this.ticketTitle = ''
			this.ticketDescription = ''
			this.ticketType = 'error'

			// Ocultar mensaje de éxito tras 5 segundos
			setTimeout(() => this.ticketSuccess.set(false), 5000)
		} catch (err: any) {
			this.ticketError.set(err?.message ?? 'Error al enviar el ticket')
		} finally {
			this.ticketSubmitting.set(false)
		}
	}
}
