import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router'
import { FeedService } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'
import { ENVIRONMENT } from '@core/tokens/environment.token'
import { ShoppingListService } from '@features/shopping-list/shopping-list.service'

type Section = 'pasos' | 'ingredientes' | 'receta' | 'notas'
type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking'

const VOICE_COMMANDS: { patterns: string[]; id: string }[] = [
	{ id: 'next',        patterns: ['siguiente paso', 'siguiente', 'adelante', 'avanza', 'próximo'] },
	{ id: 'prev',        patterns: ['paso anterior', 'anterior', 'atrás', 'vuelve', 'regresa', 'retrocede'] },
	{ id: 'repeat',      patterns: ['repite', 'repetir', 'de nuevo', 'otra vez', 'dime el paso', 'qué decía'] },
	{ id: 'ingredients', patterns: ['ingredientes', 'lista ingredientes', 'muéstrame ingredientes'] },
	{ id: 'timer_start', patterns: ['inicia timer', 'empieza timer', 'pon el timer', 'arranca temporizador', 'inicia temporizador', 'empieza a contar'] },
	{ id: 'timer_stop',  patterns: ['para el timer', 'pausa el timer', 'detén timer', 'para temporizador'] },
	{ id: 'exit',        patterns: ['salir', 'cerrar modo cocina', 'terminar modo cocina'] },
]

@Component({
	selector: 'app-cooking-mode-page',
	imports: [],
	templateUrl: './cooking-mode-page.html',
})
export class CookingModePage implements OnInit, OnDestroy {
	private readonly route       = inject(ActivatedRoute)
	readonly router              = inject(Router)
	private readonly feedService = inject(FeedService)
	private readonly http        = inject(HttpClient)
	private readonly env         = inject(ENVIRONMENT)
	readonly shoppingList        = inject(ShoppingListService)

	// ─── Estado ──────────────────────────────────────────────────────
	readonly post               = signal<Post | null>(null)
	readonly loading            = signal(true)
	readonly activeStep         = signal(0)
	readonly activeSection      = signal<Section>('pasos')
	readonly checkedIngredients = signal<Set<string>>(new Set())
	readonly notes              = signal('')
	readonly showSheet          = signal(false)
	readonly done               = signal(false)
	readonly stepVisible        = signal(true)

	// ─── Timer ───────────────────────────────────────────────────────
	readonly editingTimer = signal(false)
	readonly timerInput   = signal('5')
	readonly timerTotal   = signal(300)
	readonly timerElapsed = signal(0)
	readonly timerRunning = signal(false)
	private timerInterval: ReturnType<typeof setInterval> | null = null

	// ─── TTS ─────────────────────────────────────────────────────────
	readonly voiceActive  = signal(false)
	readonly cookingMuted = signal(this.readMutedPref())
	readonly voiceName    = signal<string>('')
	private bestVoice: SpeechSynthesisVoice | null = null
	private static readonly MUTE_KEY = 'savorealo:cookingMuted'

	// ─── Asistente ───────────────────────────────────────────────────
	readonly assistantState    = signal<AssistantState>('idle')
	readonly transcript        = signal('')
	readonly assistantResponse = signal('')
	readonly hasVoiceSupport   = signal(false)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private recognition: any = null
	private responseTimer: ReturnType<typeof setTimeout> | null = null

	// ─── Wake lock ───────────────────────────────────────────────────
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private wakeLock: any = null

	// ─── Swipe ───────────────────────────────────────────────────────
	private touchStartX = 0
	private touchStartY = 0

	// ─── Computadas ──────────────────────────────────────────────────
	readonly Math        = Math
	readonly steps       = computed(() => this.post()?.recipe?.steps ?? [])
	readonly currentStep = computed(() => this.steps()[this.activeStep()] ?? null)
	readonly stepsCount  = computed(() => this.steps().length)
	readonly isFirst     = computed(() => this.activeStep() === 0)
	readonly isLast      = computed(() => this.activeStep() === this.stepsCount() - 1)
	readonly progress    = computed(() => {
		const t = this.stepsCount()
		return t ? ((this.activeStep() + 1) / t) * 100 : 0
	})
	readonly nextStepText = computed(() => {
		const n = this.steps()[this.activeStep() + 1]
		if (!n) return null
		return n.text.length > 65 ? n.text.slice(0, 65) + '…' : n.text
	})
	readonly ingredientsLeft = computed(() =>
		(this.post()?.recipe?.ingredients?.length ?? 0) - this.checkedIngredients().size,
	)
	readonly stepSuggestedMinutes = computed(() =>
		this.extractMinutes(this.currentStep()?.text ?? ''),
	)
	readonly timerRemaining     = computed(() => this.timerTotal() - this.timerElapsed())
	readonly timerMinutes       = computed(() => Math.floor(this.timerRemaining() / 60).toString().padStart(2, '0'))
	readonly timerSeconds       = computed(() => (this.timerRemaining() % 60).toString().padStart(2, '0'))
	readonly timerCircumference  = 2 * Math.PI * 42
	readonly timerCircle        = computed(() => {
		const pct = this.timerTotal() > 0 ? this.timerElapsed() / this.timerTotal() : 0
		return this.timerCircumference * (1 - pct)
	})
	readonly authorName         = computed(() => {
		const p = this.post()
		return p?.author.name ?? p?.author.username ?? 'Chef'
	})
	readonly assistantActive = computed(() => this.assistantState() !== 'idle')

	// ─── Teclado ─────────────────────────────────────────────────────
	private readonly keyListener = (e: KeyboardEvent) => {
		const tag = (e.target as HTMLElement).tagName
		if (tag === 'TEXTAREA' || tag === 'INPUT') return
		if (e.key === 'ArrowRight' || e.key === 'a') this.nextStep()
		if (e.key === 'ArrowLeft')                    this.prevStep()
		if (e.key === 'p' || e.key === 'P')           this.toggleTimer()
		if (e.key === 'v' || e.key === 'V')           this.toggleMute()
		if (e.key === ' ')                             { e.preventDefault(); this.startListening() }
		if (e.key === 'Escape')                        this.exit()
	}

	// ─── Ciclo de vida ───────────────────────────────────────────────
	ngOnInit(): void {
		document.addEventListener('keydown', this.keyListener)
		const id = this.route.snapshot.paramMap.get('id')
		if (!id) { this.router.navigate(['/']); return }
		this.initVoices()
		this.initSpeechRecognition()
		this.requestWakeLock()
		this.feedService.getPostById(id).subscribe({
			next: post => { this.post.set(post); this.loading.set(false); this.speakCurrentStep(); this.autoSuggestTimer() },
			error: () => this.router.navigate(['/']),
		})
	}

	ngOnDestroy(): void {
		document.removeEventListener('keydown', this.keyListener)
		this.stopTimer()
		this.recognition?.abort()
		window.speechSynthesis?.cancel()
		this.releaseWakeLock()
		if (this.responseTimer) clearTimeout(this.responseTimer)
	}

	// ─── Pasos ───────────────────────────────────────────────────────
	nextStep(): void {
		if (this.isLast()) { this.done.set(true); window.speechSynthesis?.cancel(); return }
		this.animateStep(() => this.activeStep.update(s => s + 1))
	}

	prevStep(): void {
		if (this.isFirst()) return
		this.animateStep(() => this.activeStep.update(s => s - 1))
	}

	animateStep(fn: () => void): void {
		this.stepVisible.set(false)
		this.resetTimer()
		setTimeout(() => { fn(); this.stepVisible.set(true); this.speakCurrentStep(); this.autoSuggestTimer() }, 160)
	}

	// ─── Swipe ───────────────────────────────────────────────────────
	onTouchStart(e: TouchEvent): void {
		this.touchStartX = e.touches[0].clientX
		this.touchStartY = e.touches[0].clientY
	}

	onTouchEnd(e: TouchEvent): void {
		const dx = e.changedTouches[0].clientX - this.touchStartX
		const dy = e.changedTouches[0].clientY - this.touchStartY
		if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
		if (dx < 0) { this.nextStep() } else { this.prevStep() }
	}

	// ─── Ingredientes ────────────────────────────────────────────────
	toggleIngredient(key: string): void {
		this.checkedIngredients.update(set => {
			const next = new Set(set)
			if (next.has(key)) { next.delete(key) } else { next.add(key) }
			return next
		})
	}

	// ─── Timer ───────────────────────────────────────────────────────
	toggleTimer(): void {
		if (this.timerRunning()) { this.stopTimer() } else { this.startTimer() }
	}

	startTimer(): void {
		if (this.timerRemaining() <= 0) this.timerElapsed.set(0)
		this.timerRunning.set(true)
		this.timerInterval = setInterval(() => {
			this.timerElapsed.update(e => {
				if (e >= this.timerTotal()) { this.stopTimer(); this.onTimerDone(); return e }
				return e + 1
			})
		}, 1000)
	}

	stopTimer(): void {
		this.timerRunning.set(false)
		if (this.timerInterval !== null) { clearInterval(this.timerInterval); this.timerInterval = null }
	}

	resetTimer(): void { this.stopTimer(); this.timerElapsed.set(0) }

	applyTimerEdit(): void {
		const m = parseInt(this.timerInput(), 10)
		if (!isNaN(m) && m > 0) { this.timerTotal.set(m * 60); this.timerElapsed.set(0); this.stopTimer() }
		this.editingTimer.set(false)
	}

	applyTimerSuggestion(): void {
		const m = this.stepSuggestedMinutes()
		if (!m) return
		this.timerTotal.set(m * 60); this.timerElapsed.set(0); this.stopTimer()
	}

	private autoSuggestTimer(): void {
		const m = this.stepSuggestedMinutes()
		if (m) { this.timerTotal.set(m * 60); this.timerElapsed.set(0) }
	}

	private onTimerDone(): void {
		this.speakText('¡El tiempo ha terminado! Comprueba el punto de cocción.')
	}

	private extractMinutes(text: string): number | null {
		const hm = text.match(/(\d+)\s*(?:horas?|h)\s*(?:y\s*(\d+)\s*(?:minutos?|min))?/i)
		if (hm) return parseInt(hm[1]) * 60 + (hm[2] ? parseInt(hm[2]) : 0)
		const m = text.match(/(\d+)\s*(?:minutos?|min\.?)/i)
		return m ? parseInt(m[1]) : null
	}

	// ─── TTS ─────────────────────────────────────────────────────────
	speakCurrentStep(): void {
		if (!window.speechSynthesis) return
		window.speechSynthesis.cancel()
		this.voiceActive.set(false)
		if (this.cookingMuted()) return
		const s = this.currentStep()
		if (s?.text) this.speakText(s.text)
	}

	private speakText(text: string, onEnd?: () => void): void {
		if (!window.speechSynthesis) return
		window.speechSynthesis.cancel()
		const utt   = new SpeechSynthesisUtterance(text)
		utt.lang    = 'es-ES'
		utt.rate    = 0.9
		utt.pitch   = 1.0
		utt.volume  = 1.0
		if (this.bestVoice) utt.voice = this.bestVoice
		utt.onstart = () => this.voiceActive.set(true)
		utt.onend   = () => { this.voiceActive.set(false); onEnd?.() }
		utt.onerror = () => this.voiceActive.set(false)
		window.speechSynthesis.speak(utt)
	}

	toggleMute(): void {
		const m = !this.cookingMuted()
		this.cookingMuted.set(m)
		this.persistMutedPref(m)
		if (m) { window.speechSynthesis?.cancel(); this.voiceActive.set(false) }
		else this.speakCurrentStep()
	}

	private initVoices(): void {
		const select = () => {
			const voices   = window.speechSynthesis?.getVoices() ?? []
			const es       = voices.filter(v => v.lang.startsWith('es'))
			const markers  = ['natural', 'neural', 'premium', 'enhanced', 'google', 'microsoft', 'siri', 'lucía', 'lucia', 'mónica', 'monica', 'jorge']
			const score    = (v: SpeechSynthesisVoice) => { const i = markers.findIndex(m => v.name.toLowerCase().includes(m)); return i === -1 ? 999 : i }
			this.bestVoice = [...es].sort((a, b) => score(a) - score(b))[0] ?? null
			this.voiceName.set(this.bestVoice?.name ?? 'Voz del sistema')
		}
		if (window.speechSynthesis) { select(); window.speechSynthesis.onvoiceschanged = select }
	}

	// ─── Asistente ───────────────────────────────────────────────────
	private initSpeechRecognition(): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
		if (!SR) return
		this.hasVoiceSupport.set(true)
		this.recognition = new SR()
		this.recognition.lang            = 'es-ES'
		this.recognition.continuous      = false
		this.recognition.interimResults  = false
		this.recognition.maxAlternatives = 1
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.recognition.onresult = (e: any) => {
			const text = e.results[0][0].transcript.toLowerCase().trim()
			this.transcript.set(text)
			this.processVoiceInput(text)
		}
		this.recognition.onend  = () => { if (this.assistantState() === 'listening') this.assistantState.set('idle') }
		this.recognition.onerror = () => this.assistantState.set('idle')
	}

	startListening(): void {
		if (!this.recognition || this.assistantState() !== 'idle') return
		window.speechSynthesis?.cancel()
		this.voiceActive.set(false)
		this.transcript.set('')
		this.assistantResponse.set('')
		this.assistantState.set('listening')
		try { this.recognition.start() } catch { this.assistantState.set('idle') }
	}

	stopListening(): void {
		this.recognition?.stop()
		if (this.assistantState() === 'listening') this.assistantState.set('idle')
	}

	private processVoiceInput(text: string): void {
		if (!this.handleCommand(text)) this.callAssistant(text)
	}

	private handleCommand(text: string): boolean {
		for (const cmd of VOICE_COMMANDS) {
			if (!cmd.patterns.some(p => text.includes(p))) continue
			switch (cmd.id) {
				case 'next':        this.assistantState.set('idle'); this.nextStep(); break
				case 'prev':        this.assistantState.set('idle'); this.prevStep(); break
				case 'repeat':      this.assistantState.set('speaking'); this.speakText(this.currentStep()?.text ?? '', () => this.assistantState.set('idle')); break
				case 'ingredients': this.showSheet.set(true); this.assistantState.set('idle'); break
				case 'timer_start': if (!this.timerRunning()) this.startTimer(); this.showAssistantResponse('Temporizador en marcha.'); break
				case 'timer_stop':  this.stopTimer(); this.showAssistantResponse('Temporizador pausado.'); break
				case 'exit':        this.exit(); break
			}
			return true
		}
		return false
	}

	private callAssistant(question: string): void {
		this.assistantState.set('thinking')
		const post = this.post()
		const step = this.currentStep()
		this.http.post<{ answer: string }>(
			`${this.env.supabaseUrl}/functions/v1/cooking-assistant`,
			{
				question,
				recipe_name:  post?.recipe?.name ?? post?.title ?? 'Receta',
				step_num:     this.activeStep() + 1,
				total_steps:  this.stepsCount(),
				current_step: step?.text ?? '',
				ingredients:  post?.recipe?.ingredients?.map(i =>
					`${i.quantity ? i.quantity + ' ' + i.unit + ' de ' : ''}${i.name}`.trim(),
				) ?? [],
			},
		).subscribe({
			next: ({ answer }) => this.showAssistantResponse(answer),
			error: ()          => this.showAssistantResponse('No pude conectarme. Inténtalo de nuevo.'),
		})
	}

	private showAssistantResponse(text: string): void {
		this.assistantResponse.set(text)
		this.assistantState.set('speaking')
		if (this.responseTimer) clearTimeout(this.responseTimer)
		this.speakText(text, () => {
			this.assistantState.set('idle')
			this.responseTimer = setTimeout(() => { this.assistantResponse.set(''); this.transcript.set('') }, 4000)
		})
	}

	// ─── Wake lock ───────────────────────────────────────────────────
	private async requestWakeLock(): Promise<void> {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ('wakeLock' in navigator) this.wakeLock = await (navigator as any).wakeLock.request('screen')
		} catch { /* no soportado */ }
	}

	private releaseWakeLock(): void { this.wakeLock?.release?.(); this.wakeLock = null }

	addToShoppingList(): void {
		const post = this.post()
		if (!post?.recipe) return
		this.shoppingList.addFromRecipe(post.recipe, post.title ?? '')
	}

	exit(): void {
		const id = this.route.snapshot.paramMap.get('id')
		this.router.navigate(id ? ['/post', id] : ['/'])
	}

	private readMutedPref(): boolean {
		try { return typeof localStorage !== 'undefined' && localStorage.getItem(CookingModePage.MUTE_KEY) === '1' }
		catch { return false }
	}

	private persistMutedPref(m: boolean): void {
		try { if (typeof localStorage !== 'undefined') localStorage.setItem(CookingModePage.MUTE_KEY, m ? '1' : '0') }
		catch { /* ignorar */ }
	}
}
