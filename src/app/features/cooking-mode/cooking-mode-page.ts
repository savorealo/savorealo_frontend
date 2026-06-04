import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { ActivatedRoute, Router } from '@angular/router'
import { FeedService } from '@core/services/feed.service'
import { Post } from '@core/models/post/post.model'
import { ENVIRONMENT } from '@core/tokens/environment.token'
import { ShoppingListService } from '@features/shopping-list/shopping-list.service'

/**
 * Tipo de dato personalizado para section.
 */
type Section = 'pasos' | 'ingredientes' | 'receta' | 'notas'
/**
 * Tipo de dato personalizado para assistantstate.
 */
type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking'

/**
 * Variable o constante para v o i c e c o m m a n d s.
 */
const VOICE_COMMANDS: { patterns: string[]; id: string }[] = [
	{ id: 'next',        patterns: ['siguiente paso', 'siguiente', 'adelante', 'avanza', 'próximo'] },
	{ id: 'prev',        patterns: ['paso anterior', 'anterior', 'atrás', 'vuelve', 'regresa', 'retrocede'] },
	{ id: 'repeat',      patterns: ['repite', 'repetir', 'de nuevo', 'otra vez', 'dime el paso', 'qué decía'] },
	{ id: 'ingredients', patterns: ['ingredientes', 'lista ingredientes', 'muéstrame ingredientes'] },
	{ id: 'timer_start', patterns: ['inicia timer', 'empieza timer', 'pon el timer', 'arranca temporizador', 'inicia temporizador', 'empieza a contar'] },
	{ id: 'timer_stop',  patterns: ['para el timer', 'pausa el timer', 'detén timer', 'para temporizador'] },
	{ id: 'exit',        patterns: ['salir', 'cerrar modo cocina', 'terminar modo cocina'] },
]

/**
 * Componente principal para la vista o página de cookingmode.
 */
@Component({
	selector: 'app-cooking-mode-page',
	imports: [],
	templateUrl: './cooking-mode-page.html',
})
export class CookingModePage implements OnInit, OnDestroy {
	/**
	 * Propiedad para gestionar route.
	 */
	private readonly route       = inject(ActivatedRoute)
	/**
	 * Propiedad para gestionar router.
	 */
	readonly router              = inject(Router)
	/**
	 * Propiedad para gestionar feed service.
	 */
	private readonly feedService = inject(FeedService)
	/**
	 * Propiedad para gestionar http.
	 */
	private readonly http        = inject(HttpClient)
	/**
	 * Propiedad para gestionar env.
	 */
	private readonly env         = inject(ENVIRONMENT)
	/**
	 * Propiedad para gestionar shopping lista.
	 */
	readonly shoppingList        = inject(ShoppingListService)

	// ─── Estado ──────────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar post.
	 */
	readonly post               = signal<Post | null>(null)
	/**
	 * Propiedad para gestionar cargando.
	 */
	readonly loading            = signal(true)
	/**
	 * Propiedad para gestionar active step.
	 */
	readonly activeStep         = signal(0)
	/**
	 * Propiedad para gestionar active section.
	 */
	readonly activeSection      = signal<Section>('pasos')
	/**
	 * Propiedad para gestionar checked ingredients.
	 */
	readonly checkedIngredients = signal<Set<string>>(new Set())
	/**
	 * Propiedad para gestionar notes.
	 */
	readonly notes              = signal('')
	/**
	 * Propiedad para gestionar mostrar sheet.
	 */
	readonly showSheet          = signal(false)
	/**
	 * Propiedad para gestionar done.
	 */
	readonly done               = signal(false)
	/**
	 * Propiedad para gestionar step visible.
	 */
	readonly stepVisible        = signal(true)

	// ─── Timer ───────────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar editing timer.
	 */
	readonly editingTimer = signal(false)
	/**
	 * Propiedad para gestionar timer input.
	 */
	readonly timerInput   = signal('5')
	/**
	 * Propiedad para gestionar timer total.
	 */
	readonly timerTotal   = signal(300)
	/**
	 * Propiedad para gestionar timer elapsed.
	 */
	readonly timerElapsed = signal(0)
	/**
	 * Propiedad para gestionar timer running.
	 */
	readonly timerRunning = signal(false)
	/**
	 * Propiedad para gestionar timer interval.
	 */
	private timerInterval: ReturnType<typeof setInterval> | null = null

	// ─── TTS ─────────────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar voice active.
	 */
	readonly voiceActive  = signal(false)
	/**
	 * Propiedad para gestionar cooking muted.
	 */
	readonly cookingMuted = signal(this.readMutedPref())
	/**
	 * Propiedad para gestionar voice nombre.
	 */
	readonly voiceName    = signal<string>('')
	/**
	 * Propiedad para gestionar best voice.
	 */
	private bestVoice: SpeechSynthesisVoice | null = null
	/**
	 * Propiedad para gestionar m u t e k e y.
	 */
	private static readonly MUTE_KEY = 'savorealo:cookingMuted'

	// ─── Asistente ───────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar assistant estado.
	 */
	readonly assistantState    = signal<AssistantState>('idle')
	/**
	 * Propiedad para gestionar transcript.
	 */
	readonly transcript        = signal('')
	/**
	 * Propiedad para gestionar assistant response.
	 */
	readonly assistantResponse = signal('')
	/**
	 * Indicador booleano para tiene voice support.
	 */
	readonly hasVoiceSupport   = signal(false)
	readonly userLocation      = signal<{ lat: number; lon: number } | null>(null)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	/**
	 * Propiedad para gestionar recognition.
	 */
	private recognition: any = null
	/**
	 * Propiedad para gestionar response timer.
	 */
	private responseTimer: ReturnType<typeof setTimeout> | null = null

	// ─── Wake lock ───────────────────────────────────────────────────
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	/**
	 * Propiedad para gestionar wake lock.
	 */
	private wakeLock: any = null

	// ─── Swipe ───────────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar touch start x.
	 */
	private touchStartX = 0
	/**
	 * Propiedad para gestionar touch start y.
	 */
	private touchStartY = 0

	// ─── Computadas ──────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar math.
	 */
	readonly Math        = Math
	/**
	 * Propiedad para gestionar steps.
	 */
	readonly steps       = computed(() => this.post()?.recipe?.steps ?? [])
	/**
	 * Propiedad para gestionar current step.
	 */
	readonly currentStep = computed(() => this.steps()[this.activeStep()] ?? null)
	/**
	 * Propiedad para gestionar steps cantidad.
	 */
	readonly stepsCount  = computed(() => this.steps().length)
	/**
	 * Indicador booleano para es o está first.
	 */
	readonly isFirst     = computed(() => this.activeStep() === 0)
	/**
	 * Indicador booleano para es o está last.
	 */
	readonly isLast      = computed(() => this.activeStep() === this.stepsCount() - 1)
	/**
	 * Propiedad para gestionar progress.
	 */
	readonly progress    = computed(() => {
		const t = this.stepsCount()
		return t ? ((this.activeStep() + 1) / t) * 100 : 0
	})
	/**
	 * Propiedad para gestionar next step text.
	 */
	readonly nextStepText = computed(() => {
		const n = this.steps()[this.activeStep() + 1]
		if (!n) return null
		return n.text.length > 65 ? n.text.slice(0, 65) + '…' : n.text
	})
	/**
	 * Propiedad para gestionar ingredients left.
	 */
	readonly ingredientsLeft = computed(() =>
		(this.post()?.recipe?.ingredients?.length ?? 0) - this.checkedIngredients().size,
	)
	/**
	 * Propiedad para gestionar step suggested minutes.
	 */
	readonly stepSuggestedMinutes = computed(() =>
		this.extractMinutes(this.currentStep()?.text ?? ''),
	)
	/**
	 * Propiedad para gestionar timer remaining.
	 */
	readonly timerRemaining     = computed(() => this.timerTotal() - this.timerElapsed())
	/**
	 * Propiedad para gestionar timer minutes.
	 */
	readonly timerMinutes       = computed(() => Math.floor(this.timerRemaining() / 60).toString().padStart(2, '0'))
	/**
	 * Propiedad para gestionar timer seconds.
	 */
	readonly timerSeconds       = computed(() => (this.timerRemaining() % 60).toString().padStart(2, '0'))
	/**
	 * Propiedad para gestionar timer circumference.
	 */
	readonly timerCircumference  = 2 * Math.PI * 42
	/**
	 * Propiedad para gestionar timer circle.
	 */
	readonly timerCircle        = computed(() => {
		const pct = this.timerTotal() > 0 ? this.timerElapsed() / this.timerTotal() : 0
		return this.timerCircumference * (1 - pct)
	})
	/**
	 * Propiedad para gestionar author nombre.
	 */
	readonly authorName         = computed(() => {
		const p = this.post()
		return p?.author.name ?? p?.author.username ?? 'Chef'
	})
	/**
	 * Propiedad para gestionar assistant active.
	 */
	readonly assistantActive = computed(() => this.assistantState() !== 'idle')

	// ─── Teclado ─────────────────────────────────────────────────────
	/**
	 * Propiedad para gestionar clave listener.
	 */
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
	/**
	 * Método de ciclo de vida de Angular que se ejecuta al inicializar el componente.
	 */
	ngOnInit(): void {
		document.addEventListener('keydown', this.keyListener)
		const id = this.route.snapshot.paramMap.get('id')
		if (!id) { this.router.navigate(['/']); return }
		this.initVoices()
		this.initSpeechRecognition()
		this.initGeolocation()
		this.requestWakeLock()
		this.feedService.getPostById(id).subscribe({
			next: post => { this.post.set(post); this.loading.set(false); this.speakCurrentStep(); this.autoSuggestTimer() },
			error: () => this.router.navigate(['/']),
		})
	}

	/**
	 * Método de ciclo de vida de Angular que se ejecuta al destruir el componente para liberar recursos.
	 */
	ngOnDestroy(): void {
		document.removeEventListener('keydown', this.keyListener)
		this.stopTimer()
		this.recognition?.abort()
		window.speechSynthesis?.cancel()
		this.releaseWakeLock()
		if (this.responseTimer) clearTimeout(this.responseTimer)
	}

	// ─── Pasos ───────────────────────────────────────────────────────
	/**
	 * Método para next step.
	 */
	nextStep(): void {
		if (this.isLast()) { this.done.set(true); window.speechSynthesis?.cancel(); return }
		this.animateStep(() => this.activeStep.update(s => s + 1))
	}

	/**
	 * Método para prev step.
	 */
	prevStep(): void {
		if (this.isFirst()) return
		this.animateStep(() => this.activeStep.update(s => s - 1))
	}

	/**
	 * Método para animate step.
	 */
	animateStep(fn: () => void): void {
		this.stepVisible.set(false)
		this.resetTimer()
		setTimeout(() => { fn(); this.stepVisible.set(true); this.speakCurrentStep(); this.autoSuggestTimer() }, 160)
	}

	// ─── Swipe ───────────────────────────────────────────────────────
	/**
	 * Método para evento de touch start.
	 */
	onTouchStart(e: TouchEvent): void {
		this.touchStartX = e.touches[0].clientX
		this.touchStartY = e.touches[0].clientY
	}

	/**
	 * Método para evento de touch end.
	 */
	onTouchEnd(e: TouchEvent): void {
		const dx = e.changedTouches[0].clientX - this.touchStartX
		const dy = e.changedTouches[0].clientY - this.touchStartY
		if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return
		if (dx < 0) { this.nextStep() } else { this.prevStep() }
	}

	// ─── Ingredientes ────────────────────────────────────────────────
	/**
	 * Método para alternar ingredient.
	 */
	toggleIngredient(key: string): void {
		this.checkedIngredients.update(set => {
			const next = new Set(set)
			if (next.has(key)) { next.delete(key) } else { next.add(key) }
			return next
		})
	}

	// ─── Timer ───────────────────────────────────────────────────────
	/**
	 * Método para alternar timer.
	 */
	toggleTimer(): void {
		if (this.timerRunning()) { this.stopTimer() } else { this.startTimer() }
	}

	/**
	 * Método para start timer.
	 */
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

	/**
	 * Método para stop timer.
	 */
	stopTimer(): void {
		this.timerRunning.set(false)
		if (this.timerInterval !== null) { clearInterval(this.timerInterval); this.timerInterval = null }
	}

	/**
	 * Método para reiniciar timer.
	 */
	resetTimer(): void { this.stopTimer(); this.timerElapsed.set(0) }

	/**
	 * Método para apply timer edit.
	 */
	applyTimerEdit(): void {
		const m = parseInt(this.timerInput(), 10)
		if (!isNaN(m) && m > 0) { this.timerTotal.set(m * 60); this.timerElapsed.set(0); this.stopTimer() }
		this.editingTimer.set(false)
	}

	/**
	 * Método para apply timer suggestion.
	 */
	applyTimerSuggestion(): void {
		const m = this.stepSuggestedMinutes()
		if (!m) return
		this.timerTotal.set(m * 60); this.timerElapsed.set(0); this.stopTimer()
	}

	/**
	 * Método para auto suggest timer.
	 */
	private autoSuggestTimer(): void {
		const m = this.stepSuggestedMinutes()
		if (m) { this.timerTotal.set(m * 60); this.timerElapsed.set(0) }
	}

	/**
	 * Método para evento de timer done.
	 */
	private onTimerDone(): void {
		this.speakText('¡El tiempo ha terminado! Comprueba el punto de cocción.')
	}

	/**
	 * Método para extract minutes.
	 */
	private extractMinutes(text: string): number | null {
		const hm = text.match(/(\d+)\s*(?:horas?|h)\s*(?:y\s*(\d+)\s*(?:minutos?|min))?/i)
		if (hm) return parseInt(hm[1]) * 60 + (hm[2] ? parseInt(hm[2]) : 0)
		const m = text.match(/(\d+)\s*(?:minutos?|min\.?)/i)
		return m ? parseInt(m[1]) : null
	}

	// ─── TTS ─────────────────────────────────────────────────────────
	/**
	 * Método para speak current step.
	 */
	speakCurrentStep(): void {
		if (!window.speechSynthesis) return
		window.speechSynthesis.cancel()
		this.voiceActive.set(false)
		if (this.cookingMuted()) return
		const s = this.currentStep()
		if (s?.text) this.speakText(s.text)
	}

	/**
	 * Método para speak text.
	 */
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

	/**
	 * Método para alternar mute.
	 */
	toggleMute(): void {
		const m = !this.cookingMuted()
		this.cookingMuted.set(m)
		this.persistMutedPref(m)
		if (m) { window.speechSynthesis?.cancel(); this.voiceActive.set(false) }
		else this.speakCurrentStep()
	}

	/**
	 * Método para init voices.
	 */
	private initVoices(): void {
		const select = () => {
			const voices  = window.speechSynthesis?.getVoices() ?? []
			const es      = voices.filter(v => v.lang.startsWith('es'))
			// Voces femeninas primero, luego calidad, luego masculinas al final
			const female  = ['helena', 'laura', 'elvira', 'sabina', 'lucía', 'lucia', 'mónica', 'monica', 'paloma', 'elena', 'valentina', 'camila', 'sofía', 'sofia', 'isabella', 'rosa', 'pilar']
			const quality = ['natural', 'neural', 'premium', 'enhanced', 'google', 'microsoft', 'siri']
			const male    = ['jorge', 'pablo', 'miguel', 'carlos', 'antonio']
			const score   = (v: SpeechSynthesisVoice) => {
				const n = v.name.toLowerCase()
				const fi = female.findIndex(m => n.includes(m))
				if (fi !== -1) return fi
				const qi = quality.findIndex(m => n.includes(m))
				if (qi !== -1) return 100 + qi
				const mi = male.findIndex(m => n.includes(m))
				if (mi !== -1) return 500 + mi
				return 300
			}
			this.bestVoice = [...es].sort((a, b) => score(a) - score(b))[0] ?? null
			this.voiceName.set(this.bestVoice?.name ?? 'Voz del sistema')
		}
		if (window.speechSynthesis) { select(); window.speechSynthesis.onvoiceschanged = select }
	}

	private initGeolocation(): void {
		if (!navigator.geolocation) return
		navigator.geolocation.getCurrentPosition(
			pos => this.userLocation.set({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
			() => { /* sin ubicación: el asistente funcionará sin contexto local */ },
		)
	}

	// ─── Asistente ───────────────────────────────────────────────────
	/**
	 * Método para init speech recognition.
	 */
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

	/**
	 * Método para start listening.
	 */
	startListening(): void {
		if (!this.recognition || this.assistantState() !== 'idle') return
		window.speechSynthesis?.cancel()
		this.voiceActive.set(false)
		this.transcript.set('')
		this.assistantResponse.set('')
		this.assistantState.set('listening')
		try { this.recognition.start() } catch { this.assistantState.set('idle') }
	}

	/**
	 * Método para stop listening.
	 */
	stopListening(): void {
		this.recognition?.stop()
		if (this.assistantState() === 'listening') this.assistantState.set('idle')
	}

	/**
	 * Método para process voice input.
	 */
	private processVoiceInput(text: string): void {
		// Elimina el wake word "savo" del inicio para que también funcione como prefijo
		const cleaned = text.replace(/^(oye\s+|hola\s+)?savo[,!\s]+/i, '').trim() || text
		if (!this.handleCommand(cleaned)) this.callAssistant(cleaned)
	}

	/**
	 * Método para gestionar command.
	 */
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

	/**
	 * Método para call assistant.
	 */
	private callAssistant(question: string): void {
		this.assistantState.set('thinking')
		const post = this.post()
		const step = this.currentStep()
		const loc  = this.userLocation()
		this.http.post<{ answer: string }>(
			`${this.env.supabaseUrl}/functions/v1/cooking-assistant`,
			{
				question,
				recipe_name:   post?.recipe?.name ?? post?.title ?? 'Receta',
				step_num:      this.activeStep() + 1,
				total_steps:   this.stepsCount(),
				current_step:  step?.text ?? '',
				ingredients:   post?.recipe?.ingredients?.map(i =>
					`${i.quantity ? i.quantity + ' ' + i.unit + ' de ' : ''}${i.name}`.trim(),
				) ?? [],
				...(loc ? { user_location: loc } : {}),
			},
		).subscribe({
			next: ({ answer }) => this.showAssistantResponse(answer),
			error: ()          => this.showAssistantResponse('No pude conectarme. Inténtalo de nuevo.'),
		})
	}

	/**
	 * Método para mostrar assistant response.
	 */
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
	/**
	 * Método para request wake lock.
	 */
	private async requestWakeLock(): Promise<void> {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ('wakeLock' in navigator) this.wakeLock = await (navigator as any).wakeLock.request('screen')
		} catch { /* no soportado */ }
	}

	/**
	 * Método para release wake lock.
	 */
	private releaseWakeLock(): void { this.wakeLock?.release?.(); this.wakeLock = null }

	/**
	 * Método para añadir to shopping lista.
	 */
	addToShoppingList(): void {
		const post = this.post()
		if (!post?.recipe) return
		this.shoppingList.addFromRecipe(post.recipe, post.title ?? '')
	}

	/**
	 * Método para exit.
	 */
	exit(): void {
		const id = this.route.snapshot.paramMap.get('id')
		this.router.navigate(id ? ['/post', id] : ['/'])
	}

	/**
	 * Método para read muted pref.
	 */
	private readMutedPref(): boolean {
		try { return typeof localStorage !== 'undefined' && localStorage.getItem(CookingModePage.MUTE_KEY) === '1' }
		catch { return false }
	}

	/**
	 * Método para persist muted pref.
	 */
	private persistMutedPref(m: boolean): void {
		try { if (typeof localStorage !== 'undefined') localStorage.setItem(CookingModePage.MUTE_KEY, m ? '1' : '0') }
		catch { /* ignorar */ }
	}
}
