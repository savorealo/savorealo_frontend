import { Pipe, PipeTransform } from '@angular/core'

/**
 * Pipe para truncar texto que supera un límite de caracteres específico.
 * Añade puntos suspensivos (...) al final del texto truncado.
 */
@Pipe({
	name: 'truncate',
	standalone: true,
})
export class TruncateTextPipe implements PipeTransform {
	/**
	 * Método para transform.
	 */
	transform(value: string | null | undefined, limit = 280): string {
		if (!value) return ''
		if (value.length <= limit) return value
		return `${value.slice(0, Math.max(0, limit)).trimEnd()}...`
	}
}
