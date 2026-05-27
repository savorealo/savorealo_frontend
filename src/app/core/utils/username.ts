/**
 * Regla canónica de username (espejo de la del backend `updateProfile`).
 * 3–20 chars, minúsculas/dígitos/`_`/`.`, no empieza/termina con `.`/`_`,
 * no permite dos seguidos (`..`, `__`, `._`, `_.`).
 */
export const USERNAME_REGEX = /^(?![_.])(?!.*[_.]{2})[a-z0-9_.]{3,20}(?<![_.])$/

/**
 * Variable o constante para r e s e r v e d u s e r n a m e s.
 */
export const RESERVED_USERNAMES = [
	'admin', 'root', 'system', 'support', 'help', 'api',
	'me', 'null', 'undefined', 'savorealo', 'official',
]

/**
 * Valida el formato localmente para feedback inmediato (sin red).
 * Devuelve un mensaje en español o `null` si es válido.
 */
export function validateUsernameFormat(raw: string): string | null {
	const value = (raw ?? '').trim()
	if (!value) return 'El usuario es obligatorio.'
	if (value.length < 3) return 'Mínimo 3 caracteres.'
	if (value.length > 20) return 'Máximo 20 caracteres.'
	if (!/^[a-z0-9_.]+$/.test(value)) return 'Solo minúsculas, números, "_" y ".".'
	if (/^[_.]|[_.]$/.test(value)) return 'No puede empezar ni terminar con "." o "_".'
	if (/[_.]{2}/.test(value)) return 'No uses "." o "_" seguidos.'
	if (!USERNAME_REGEX.test(value)) return 'Usuario no válido.'
	if (RESERVED_USERNAMES.includes(value)) return 'Ese usuario está reservado.'
	return null
}
