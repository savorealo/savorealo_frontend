import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { DecimalPipe, Location } from '@angular/common'
import { FeedService } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'

type Section = 'pasos' | 'ingredientes' | 'receta' | 'notas'

@Component({
	selector: 'app-cooking-mode-page',
	imports: [DecimalPipe],
	templateUrl: './cooking-mode-page.html',
})
export class CookingModePage implements OnInit, OnDestroy {
	private readonly route = inject(ActivatedRoute)
	readonly router = inject(Router)
	private readonly location = inject(Location)
	private readonly feedService = inject(FeedService)

	readonly post = signal<Post | null>(null)
	readonly loading = signal(true)
	readonly activeStep = signal(0)
	readonly activeSection = signal<Section>('pasos')
	readonly checkedIngredients = signal<Set<string>>(new Set())
	readonly notes = signal('')
	readonly editingTimer = signal(false)
	readonly timerInput = signal('5')

	readonly timerTotal = signal(300)
	readonly timerElapsed = signal(0)
	readonly timerRunning = signal(false)
	private timerInterval: ReturnType<typeof setInterval> | null = null

	readonly voiceActive = signal(false)
	readonly cookingMuted = signal(this.readMutedPref())

	private static readonly MUTE_KEY = 'savorealo:cookingMuted'

	readonly steps = computed(() => this.post()?.recipe?.steps ?? [])
	readonly currentStep = computed(() => this.steps()[this.activeStep()] ?? null)
	readonly stepsCount = computed(() => this.steps().length)
	readonly isFirst = computed(() => this.activeStep() === 0)
	readonly isLast = computed(() => this.activeStep() === this.stepsCount() - 1)

	readonly progress = computed(() => {
		const total = this.stepsCount()
		if (!total) return 0
		return ((this.activeStep() + 1) / total) * 100
	})

	readonly timerRemaining = computed(() => this.timerTotal() - this.timerElapsed())
	readonly timerMinutes = computed(() => Math.floor(this.timerRemaining() / 60).toString().padStart(2, '0'))
	readonly timerSeconds = computed(() => (this.timerRemaining() % 60).toString().padStart(2, '0'))
	readonly timerCircle = computed(() => {
		const circumference = 2 * Math.PI * 45
		const pct = this.timerTotal() > 0 ? this.timerElapsed() / this.timerTotal() : 0
		return circumference * (1 - pct)
	})
	readonly timerCircumference = 2 * Math.PI * 45

	readonly authorName = computed(() => {
		const p = this.post()
		return p?.author.name ?? p?.author.username ?? 'Chef'
	})

	private readonly keyListener = (e: KeyboardEvent) => {
		if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return
		if (e.key === 'ArrowRight' || e.key === 'a' || e.key === 'A') this.nextStep()
		if (e.key === 'ArrowLeft') this.prevStep()
		if (e.key === 'p' || e.key === 'P') this.toggleTimer()
		if (e.key === 'v' || e.key === 'V') this.toggleMute()
		if (e.key === 'Escape') this.exit()
	}

	ngOnInit(): void {
		document.addEventListener('keydown', this.keyListener)
		const id = this.route.snapshot.paramMap.get('id')
		if (!id) { this.router.navigate(['/']); return }
		this.feedService.getPostById(id).subscribe({
			next: post => {
				this.post.set(post)
				this.loading.set(false)
				this.speakCurrentStep()
			},
			error: () => { this.router.navigate(['/']); },
		})
	}

	ngOnDestroy(): void {
		document.removeEventListener('keydown', this.keyListener)
		this.stopTimer()
		window.speechSynthesis?.cancel()
	}

	nextStep(): void {
		if (this.isLast()) return
		this.activeStep.update(s => s + 1)
		this.resetTimer()
		this.speakCurrentStep()
	}

	prevStep(): void {
		if (this.isFirst()) return
		this.activeStep.update(s => s - 1)
		this.resetTimer()
		this.speakCurrentStep()
	}

	toggleIngredient(key: string): void {
		this.checkedIngredients.update(set => {
			const next = new Set(set)
			next.has(key) ? next.delete(key) : next.add(key)
			return next
		})
	}

	toggleTimer(): void {
		this.timerRunning() ? this.stopTimer() : this.startTimer()
	}

	startTimer(): void {
		if (this.timerRemaining() <= 0) this.timerElapsed.set(0)
		this.timerRunning.set(true)
		this.timerInterval = setInterval(() => {
			this.timerElapsed.update(e => {
				if (e >= this.timerTotal()) { this.stopTimer(); return e }
				return e + 1
			})
		}, 1000)
	}

	stopTimer(): void {
		this.timerRunning.set(false)
		if (this.timerInterval !== null) { clearInterval(this.timerInterval); this.timerInterval = null }
	}

	resetTimer(): void {
		this.stopTimer()
		this.timerElapsed.set(0)
	}

	applyTimerEdit(): void {
		const mins = parseInt(this.timerInput(), 10)
		if (!isNaN(mins) && mins > 0) {
			this.timerTotal.set(mins * 60)
			this.timerElapsed.set(0)
			this.stopTimer()
		}
		this.editingTimer.set(false)
	}

	/** Lee en voz alta el paso actual si el TTS no está muteado. */
	speakCurrentStep(): void {
		if (typeof window === 'undefined' || !window.speechSynthesis) return
		window.speechSynthesis.cancel()
		this.voiceActive.set(false)
		if (this.cookingMuted()) return
		const step = this.currentStep()
		if (!step?.text) return
		const utt = new SpeechSynthesisUtterance(step.text)
		utt.lang = 'es-ES'
		utt.onend = () => this.voiceActive.set(false)
		this.voiceActive.set(true)
		window.speechSynthesis.speak(utt)
	}

	/** Alterna el mute del TTS y lo persiste entre sesiones. */
	toggleMute(): void {
		const muted = !this.cookingMuted()
		this.cookingMuted.set(muted)
		this.persistMutedPref(muted)
		if (muted) {
			window.speechSynthesis?.cancel()
			this.voiceActive.set(false)
		} else {
			this.speakCurrentStep()
		}
	}

	private readMutedPref(): boolean {
		try {
			return typeof localStorage !== 'undefined'
				&& localStorage.getItem(CookingModePage.MUTE_KEY) === '1'
		} catch {
			return false
		}
	}

	private persistMutedPref(muted: boolean): void {
		try {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(CookingModePage.MUTE_KEY, muted ? '1' : '0')
			}
		} catch { /* ignore */ }
	}

	exit(): void {
		this.location.back()
	}
}
