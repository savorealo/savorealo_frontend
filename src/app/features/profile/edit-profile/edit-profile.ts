import {
	Component,
	inject,
	signal,
	computed,
	output,
	OnInit,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { TranslatePipe } from '@shared/pipes/translate.pipe'
import { AuthStore } from '@core/store/auth.store'
import { PostMediaService } from '@core/services/post-media.service'
import { UserService } from '@core/services/user.service'
import { UpdatePersonProfileInput } from '@core/services/profile-service'
import { validateUsernameFormat } from '@core/utils/username'
import { finalize } from 'rxjs'

/**
 * Componente principal para la vista o página de editprofile.
 */
@Component({
	selector: 'app-edit-profile',
	standalone: true,
	imports: [FormsModule, TranslatePipe],
	templateUrl: './edit-profile.html',
})
export class EditProfileComponent implements OnInit {
	/** Emite false cuando el usuario cierra o guarda — el padre cierra el dialog */
	readonly visibleChange = output<boolean>()

	/**
	 * Propiedad para gestionar auth store.
	 */
	readonly authStore    = inject(AuthStore)
	/**
	 * Propiedad para gestionar media.
	 */
	private readonly media = inject(PostMediaService)
	/**
	 * Propiedad para gestionar user service.
	 */
	private readonly userService = inject(UserService)

	/**
	 * Propiedad para gestionar nombre de usuario error.
	 */
	readonly usernameError = signal<string | null>(null)
	/**
	 * Propiedad para gestionar nombre de usuario checking.
	 */
	readonly usernameChecking = signal(false)
	/**
	 * Propiedad para gestionar nombre de usuario timer.
	 */
	private usernameTimer: ReturnType<typeof setTimeout> | null = null

	/**
	 * Propiedad para gestionar form.
	 */
	form = signal<UpdatePersonProfileInput>({
		username:    '',
		displayName: '',
		avatarUrl:   '',
		bio:         '',
		location:    '',
		birthDate:   '',
	})

	/**
	 * Propiedad para gestionar initial.
	 */
	private initial = signal<UpdatePersonProfileInput>({})

	/**
	 * Propiedad para gestionar éxito.
	 */
	success       = signal(false)
	/**
	 * Propiedad para gestionar uploading foto.
	 */
	uploadingPhoto = signal(false)
	/**
	 * Propiedad para gestionar foto preview.
	 */
	photoPreview   = signal<string | null>(null)

	/**
	 * Propiedad para gestionar biografía length.
	 */
	bioLength = computed(() => (this.form().bio ?? '').length)

	/**
	 * Indicador booleano para es o está dirty.
	 */
	isDirty = computed(() => {
		const f = this.form()
		const i = this.initial()
		return (Object.keys(f) as (keyof UpdatePersonProfileInput)[])
			.some(key => f[key] !== i[key])
	})

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
	ngOnInit(): void {
		const p = this.authStore.profile()
		if (!p) return

		const initial: UpdatePersonProfileInput = {
			username:    p.username   ?? '',
			displayName: p.fullName   ?? '',
			avatarUrl:   p.photo_url  ?? '',
			bio:         p.bio        ?? '',
			location:    p.location   ?? '',
			birthDate:   p.birth_date
				? new Date(p.birth_date).toISOString().split('T')[0]
				: '',
		}

		this.form.set({ ...initial })
		this.initial.set({ ...initial })
		this.photoPreview.set(p.photo_url ?? null)
	}

	/**
	 * Método para patch.
	 */
	patch(partial: Partial<UpdatePersonProfileInput>): void {
		this.form.update(f => ({ ...f, ...partial }))
		this.success.set(false)
		if ('username' in partial) this.validateUsername((partial.username ?? '').trim())
	}

	/**
	 * Método para validate nombre de usuario.
	 */
	private validateUsername(value: string): void {
		if (this.usernameTimer) { clearTimeout(this.usernameTimer); this.usernameTimer = null }

		// Sin cambios respecto al original → nada que validar
		if (value === (this.initial().username ?? '')) {
			this.usernameError.set(null)
			this.usernameChecking.set(false)
			return
		}

		const localErr = validateUsernameFormat(value)
		if (localErr) {
			this.usernameError.set(localErr)
			this.usernameChecking.set(false)
			return
		}

		this.usernameError.set(null)
		this.usernameChecking.set(true)
		this.usernameTimer = setTimeout(() => {
			this.userService.checkUsername(value).subscribe({
				next: res => {
					this.usernameChecking.set(false)
					this.usernameError.set(res.valid && res.available ? null : (res.reason ?? 'Ese usuario no está disponible.'))
				},
				error: () => this.usernameChecking.set(false),
			})
		}, 400)
	}

	/**
	 * Método para evento de avatar file.
	 */
	onAvatarFile(event: Event): void {
		const input = event.target as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return

		// Show local preview immediately
		this.photoPreview.set(URL.createObjectURL(file))
		this.uploadingPhoto.set(true)

		this.media.uploadPostImage(file).pipe(
			finalize(() => this.uploadingPhoto.set(false)),
		).subscribe({
			next: url => {
				this.patch({ avatarUrl: url })
				this.photoPreview.set(url)
			},
			error: () => {
				// revert preview on failure
				this.photoPreview.set(this.form().avatarUrl || null)
			},
		})

		input.value = ''
	}

	/**
	 * Indicador booleano para puede guardar.
	 */
	readonly canSave = computed(() =>
		this.isDirty() && !this.usernameError() && !this.usernameChecking(),
	)

	/**
	 * Método para enviar.
	 */
	submit(): void {
		if (!this.canSave()) return

		const diff: UpdatePersonProfileInput = {}
		const f = this.form()
		const i = this.initial()

		;(Object.keys(f) as (keyof UpdatePersonProfileInput)[]).forEach(key => {
			if (f[key] !== i[key]) (diff as Record<string, unknown>)[key] = f[key] || undefined
		})

		this.authStore.updateProfile(diff).subscribe({
			next: () => {
				this.success.set(true)
				this.initial.set({ ...this.form() })
				setTimeout(() => this.visibleChange.emit(false), 1000)
			},
			error: () => {},
		})
	}

	/**
	 * Método para evento de cerrar.
	 */
	onClose(): void {
		this.visibleChange.emit(false)
	}
}
