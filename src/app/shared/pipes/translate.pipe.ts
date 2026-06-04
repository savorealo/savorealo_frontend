import { Pipe, PipeTransform, inject } from '@angular/core'
import { TranslationService } from '@core/services/translation.service'

/**
 * Pipe para traducir claves de localización dinámicamente en las plantillas.
 * Utiliza el TranslationService para resolver las claves de traducción.
 */
@Pipe({
	name: 'translate',
	standalone: true,
	pure: false, // Ensures it re-evaluates when language changes without input parameter changes
})
export class TranslatePipe implements PipeTransform {
	/**
	 * Propiedad para gestionar translation service.
	 */
	private readonly translationService = inject(TranslationService)

	/**
	 * Método para transform.
	 */
	transform(key: string | null | undefined): string {
		if (!key) return ''
		return this.translationService.translate(key)
	}
}
