import {
	Component,
	inject,
	signal,
	computed,
	output,
	OnInit,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { AuthStore } from '@core/store/auth.store'
import { PostMediaService } from '@core/services/post-media.service'
import { UpdatePersonProfileInput } from '@core/services/profile-service'
import { finalize } from 'rxjs'

@Component({
	selector: 'app-edit-profile',
	standalone: true,
	imports: [FormsModule],
	templateUrl: './edit-profile.html',
})
export class EditProfileComponent implements OnInit {
	/** Emite false cuando el usuario cierra o guarda — el padre cierra el dialog */
	readonly visibleChange = output<boolean>()

	readonly authStore    = inject(AuthStore)
	private readonly media = inject(PostMediaService)

	form = signal<UpdatePersonProfileInput>({
		username:  '',
		fullName:  '',
		photoUrl:  '',
		bio:       '',
		location:  '',
		birthDate: '',
	})

	private initial = signal<UpdatePersonProfileInput>({})

	success       = signal(false)
	uploadingPhoto = signal(false)
	photoPreview   = signal<string | null>(null)

	bioLength = computed(() => (this.form().bio ?? '').length)

	isDirty = computed(() => {
		const f = this.form()
		const i = this.initial()
		return (Object.keys(f) as (keyof UpdatePersonProfileInput)[])
			.some(key => f[key] !== i[key])
	})

	ngOnInit(): void {
		const p = this.authStore.profile()
		if (!p) return

		const initial: UpdatePersonProfileInput = {
			username:  p.username   ?? '',
			fullName:  p.fullName   ?? '',
			photoUrl:  p.photo_url  ?? '',
			bio:       p.bio        ?? '',
			location:  p.location   ?? '',
			birthDate: p.birth_date
				? new Date(p.birth_date).toISOString().split('T')[0]
				: '',
		}

		this.form.set({ ...initial })
		this.initial.set({ ...initial })
		this.photoPreview.set(p.photo_url ?? null)
	}

	patch(partial: Partial<UpdatePersonProfileInput>): void {
		this.form.update(f => ({ ...f, ...partial }))
		this.success.set(false)
	}

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
				this.patch({ photoUrl: url })
				this.photoPreview.set(url)
			},
			error: () => {
				// revert preview on failure
				this.photoPreview.set(this.form().photoUrl || null)
			},
		})

		input.value = ''
	}

	submit(): void {
		if (!this.isDirty()) return

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

	onClose(): void {
		this.visibleChange.emit(false)
	}
}
