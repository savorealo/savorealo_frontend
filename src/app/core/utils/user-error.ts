/**
 * Convierte un error técnico (Supabase/PostgREST/red/JWT) en un mensaje
 * apto para el usuario. Nunca se debe mostrar `err.message` crudo en la UI
 * (ej. "permission denied for table post_media"): se registra en consola
 * para depuración y se devuelve un texto amable.
 */

const FRIENDLY_AUTH_MESSAGES: Record<string, string> = {
	'invalid login credentials': 'Email o contraseña incorrectos.',
	'email not confirmed': 'Confirma tu email antes de iniciar sesión.',
	'user already registered': 'Ya existe una cuenta con este email.',
	'email rate limit exceeded': 'Demasiados intentos. Espera unos minutos.',
	'password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
}

/**
 * Función de utilidad para to user message.
 */
export function toUserMessage(err: unknown, fallback: string): string {
	if (typeof console !== 'undefined') console.error('[savorealo]', err)

	const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
	const normalized = raw.trim().toLowerCase()

	for (const key of Object.keys(FRIENDLY_AUTH_MESSAGES)) {
		if (normalized.includes(key)) return FRIENDLY_AUTH_MESSAGES[key]
	}

	if (
		normalized.includes('failed to fetch') ||
		normalized.includes('networkerror') ||
		normalized.includes('network request failed')
	) {
		return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
	}

	return fallback
}
