import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { timeout } from 'rxjs/operators'
import { ENVIRONMENT } from '@core/tokens/environment.token'

/**
 * Interfaz que define la estructura o contrato de datos para agentresponse.
 */
export interface AgentResponse {
	/**
	 * Propiedad para gestionar output.
	 */
	output: string
}

/**
 * Servicio que provee la lógica de negocio para el agente generador de recetas IA (n8n).
 */
@Injectable({ providedIn: 'root' })
export class RecipeAgentService {
	/**
	 * Propiedad para gestionar http.
	 */
	private readonly http = inject(HttpClient)
	/**
	 * Propiedad para gestionar env.
	 */
	private readonly env = inject(ENVIRONMENT)

	/**
	 * Envía un mensaje al agente de n8n y devuelve su respuesta en Markdown.
	 * El agente puede tardar hasta 30 segundos; el timeout está configurado en 60s.
	 */
	sendMessage(message: string, sessionId: string): Observable<AgentResponse> {
		return this.http
			.post<AgentResponse>(this.env.recipeAgentUrl, {
				action: 'sendMessage',
				sessionId,
				chatInput: message,
			})
			.pipe(timeout(60_000))
	}

	/**
	 * Genera un sessionId único combinando el userId (si existe) con un timestamp.
	 */
	newSessionId(userId?: string | null): string {
		return `${userId ?? 'anon'}_${Date.now()}`
	}
}
