import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { catchError, map, tap } from 'rxjs/operators'
import { LanguageCode, TranslationService } from './translation.service'

const LANG_MAP: Record<LanguageCode, string> = {
	es:      'es',
	en:      'en',
	fr:      'fr',
	de:      'de',
	it:      'it',
	'pt-BR': 'pt',
	nl:      'nl',
	sv:      'sv',
	no:      'no',
	ja:      'ja',
	ko:      'ko',
	ar:      'ar',
	hi:      'hi',
	id:      'id',
}

/**
 * Servicio para traducir contenido dinámico (posts, mensajes) al idioma activo del usuario.
 * Usa la API pública de Google Translate (endpoint gtx/client) — sin clave, sin registro.
 * Incluye caché en memoria para evitar llamadas repetidas al mismo texto+idioma.
 */
@Injectable({ providedIn: 'root' })
export class ContentTranslationService {
	private readonly http               = inject(HttpClient)
	private readonly translationService = inject(TranslationService)

	private readonly cache = new Map<string, string>()

	/**
	 * Traduce el texto dado al idioma actualmente configurado en la app.
	 * Si el resultado ya está en caché, lo devuelve sin llamada de red.
	 */
	translate(text: string): Observable<string> {
		const targetLang = this.translationService.currentLang()
		const targetCode = LANG_MAP[targetLang] ?? 'en'
		const cacheKey   = `${targetLang}::${text}`

		const cached = this.cache.get(cacheKey)
		if (cached !== undefined) {
			return of(cached)
		}

		// Google Translate endpoint no oficial — estable desde 2010, sin API key
		// Respuesta: [[["texto traducido","original",null,null,1],...],null,"lang_detectado",...]
		const url = `https://translate.googleapis.com/translate_a/single`
			+ `?client=gtx&sl=auto&tl=${targetCode}&dt=t`
			+ `&q=${encodeURIComponent(text)}`

		return this.http.get<unknown[]>(url).pipe(
			map(res => {
				// res[0] es un array de segmentos traducidos; res[0][0][0] es el primer segmento
				const segments = res?.[0] as Array<Array<string>> | null
				if (!segments?.length) throw new Error('empty_result')

				// Concatenar todos los segmentos (textos largos vienen troceados)
				const translated = segments
					.map(s => s?.[0] ?? '')
					.join('')
					.trim()

				if (!translated) throw new Error('empty_translation')
				return translated
			}),
			tap(translated => this.cache.set(cacheKey, translated)),
			catchError(err => {
				console.error('[ContentTranslation] error:', err)
				throw err
			}),
		)
	}
}
