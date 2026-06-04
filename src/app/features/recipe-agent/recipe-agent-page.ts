import { Component, computed, inject, signal, ElementRef, viewChild, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { AppShell } from '@shared/components/app-shell/app-shell'
import { SavoLoader } from '@shared/components/savo-loader/savo-loader'
import { RecipeAgentService } from '@core/services/recipe-agent.service'
import { AuthStore } from '@core/store/auth.store'
import { RecipeMarkdownPipe } from './recipe-markdown.pipe'
import { finalize } from 'rxjs'

/**
 * Interfaz que define la estructura o contrato de datos para chatmessage.
 */
export interface ChatMessage {
	/**
	 * Propiedad para gestionar role.
	 */
	role: 'user' | 'agent'
	/**
	 * Propiedad para gestionar content.
	 */
	content: string
}

/**
 * Componente principal para la vista de generación de recetas con IA (agente n8n).
 * Mantiene una conversación en sesión con el agente, renderiza el Markdown de las respuestas
 * y muestra un shimmer mientras espera (el agente tarda ~15-30 segundos).
 */
@Component({
	selector: 'app-recipe-agent-page',
	imports: [AppShell, FormsModule, SavoLoader, RecipeMarkdownPipe],
	templateUrl: './recipe-agent-page.html',
})
export class RecipeAgentPage {
	/**
	 * Propiedad para gestionar agent service.
	 */
	private readonly agentService = inject(RecipeAgentService)
	/**
	 * Propiedad para gestionar auth store.
	 */
	private readonly authStore = inject(AuthStore)
	/**
	 * Propiedad para gestionar platform id.
	 */
	private readonly platformId = inject(PLATFORM_ID)

	/**
	 * Referencia al contenedor de mensajes para auto-scroll.
	 */
	readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer')

	/**
	 * Identificador de sesión actual. Cambia al iniciar una nueva sesión.
	 */
	readonly sessionId = signal<string>(this.agentService.newSessionId(this.authStore.currentUserId()))

	/**
	 * Historial de mensajes de la conversación en curso.
	 */
	readonly history = signal<ChatMessage[]>([])

	/**
	 * Texto del input que el usuario está escribiendo.
	 */
	readonly inputText = signal<string>('')

	/**
	 * Indica si hay una petición en vuelo hacia el agente.
	 */
	readonly loading = signal<boolean>(false)

	/**
	 * Mensaje de error si la última petición falló.
	 */
	readonly error = signal<string | null>(null)

	/**
	 * Si el botón de envío debe estar habilitado.
	 */
	readonly canSend = computed(() => this.inputText().trim().length > 0 && !this.loading())

	/**
	 * Si hay historial activo (para mostrar botón "Nueva receta").
	 */
	readonly hasHistory = computed(() => this.history().length > 0)

	/**
	 * Sugerencias de prompts de ejemplo para el usuario.
	 */
	readonly suggestions = [
		'Quiero una receta rápida con pollo y limón',
		'Tengo brócoli, arroz y huevos, ¿qué puedo hacer?',
		'Una receta vegana saludable para 2 personas',
		'Algo gourmet con salmón y aguacate',
	]

	/**
	 * Envía el mensaje actual al agente y añade la respuesta al historial.
	 */
	send(): void {
		const text = this.inputText().trim()
		if (!text || this.loading()) return

		this.inputText.set('')
		this.error.set(null)
		this.history.update(h => [...h, { role: 'user', content: text }])
		this.loading.set(true)
		this.scrollToBottom()

		this.agentService
			.sendMessage(text, this.sessionId())
			.pipe(finalize(() => this.loading.set(false)))
			.subscribe({
				next: response => {
					this.history.update(h => [...h, { role: 'agent', content: response.output }])
					this.scrollToBottom()
				},
				error: () => {
					this.error.set('El agente no pudo responder. Inténtalo de nuevo en unos segundos.')
					this.scrollToBottom()
				},
			})
	}

	/**
	 * Aplica una sugerencia como texto de input.
	 */
	applySuggestion(text: string): void {
		this.inputText.set(text)
	}

	/**
	 * Inicia una nueva sesión: limpia historial, error y genera un nuevo sessionId.
	 */
	newSession(): void {
		this.history.set([])
		this.error.set(null)
		this.inputText.set('')
		this.sessionId.set(this.agentService.newSessionId(this.authStore.currentUserId()))
	}

	/**
	 * Maneja el evento keydown en el textarea: Ctrl+Enter o Cmd+Enter envía el mensaje.
	 */
	onKeyDown(event: KeyboardEvent): void {
		if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
			event.preventDefault()
			this.send()
		}
	}

	/**
	 * Método para scroll to bottom.
	 */
	private scrollToBottom(): void {
		if (!isPlatformBrowser(this.platformId)) return
		setTimeout(() => {
			const el = this.messagesContainer()?.nativeElement
			if (el) el.scrollTop = el.scrollHeight
		}, 0)
	}
}
