import { inject, Pipe, PipeTransform } from '@angular/core'
import { DomSanitizer, SafeHtml } from '@angular/platform-browser'

/**
 * Pipe que convierte el Markdown del agente de recetas a SafeHtml.
 * Usa bypassSecurityTrustHtml porque el contenido viene de nuestro propio agente n8n.
 * Maneja: encabezados, negrita, cursiva, listas (• y -), listas numeradas,
 * enlaces `[texto](url)` e imágenes detectadas por texto del enlace.
 */
@Pipe({
	name: 'recipeMarkdown',
	standalone: true,
})
export class RecipeMarkdownPipe implements PipeTransform {
	private readonly sanitizer = inject(DomSanitizer)

	/**
	 * Método para transform.
	 */
	transform(value: string | null | undefined): SafeHtml {
		if (!value) return this.sanitizer.bypassSecurityTrustHtml('')

		// Extraer enlaces ANTES de escapar HTML para preservar las URLs
		const links: Array<{ text: string; url: string }> = []
		const withPlaceholders = value
			.replace(/\r\n/g, '\n')
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text: string, url: string) => {
				const idx = links.length
				links.push({ text: text.trim(), url: url.trim() })
				return `@@LINK_${idx}@@`
			})

		const lines = withPlaceholders.split('\n')
		const rendered: string[] = []
		let index = 0

		while (index < lines.length) {
			// Bullet con • (bullet character del agente)
			const bulletItem = this.getBulletItem(lines[index])
			if (bulletItem !== null) {
				const items: string[] = []
				while (index < lines.length) {
					const item = this.getBulletItem(lines[index])
					if (item === null) break
					items.push(`<li>${this.renderInline(this.escapeHtml(item), links)}</li>`)
					index++
				}
				rendered.push(`<ul class="my-2 space-y-1 pl-4">${items.join('')}</ul>`)
				continue
			}

			// Lista numerada 1. 2. etc.
			const orderedItem = this.getOrderedItem(lines[index])
			if (orderedItem !== null) {
				const items: string[] = []
				let counter = 1
				while (index < lines.length) {
					const item = this.getOrderedItem(lines[index])
					if (item === null) break
					items.push(
						`<li class="flex gap-3"><span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary text-label-sm font-bold text-on-primary">${counter}</span><span>${this.renderInline(this.escapeHtml(item), links)}</span></li>`,
					)
					index++
					counter++
				}
				rendered.push(`<ol class="my-2 space-y-2">${items.join('')}</ol>`)
				continue
			}

			rendered.push(this.renderLine(lines[index], links))
			index++
		}

		return this.sanitizer.bypassSecurityTrustHtml(rendered.join(''))
	}

	/**
	 * Método para render line.
	 */
	private renderLine(line: string, links: Array<{ text: string; url: string }>): string {
		const escaped = this.escapeHtml(line)
		if (!escaped.trim()) return '<div class="h-2"></div>'

		const headingMatch = escaped.match(/^(#{1,3})\s+(.+)$/)
		if (headingMatch) {
			const level = headingMatch[1].length
			const classes =
				level === 1
					? 'mt-4 mb-2 font-display text-headline-sm font-bold text-on-surface'
					: level === 2
						? 'mt-3 mb-1 text-title-md font-bold text-on-surface'
						: 'mt-2 mb-1 text-title-sm font-semibold text-on-surface'
			return `<p class="${classes}">${this.renderInline(headingMatch[2], links)}</p>`
		}

		// Línea horizontal ---
		if (/^-{3,}$/.test(escaped.trim())) {
			return '<hr class="my-4 border-outline/40">'
		}

		return `<p class="text-body-md leading-relaxed text-on-surface">${this.renderInline(escaped, links)}</p>`
	}

	/**
	 * Método para render inline.
	 */
	private renderInline(value: string, links: Array<{ text: string; url: string }>): string {
		// Proteger código inline primero
		const codeParts: string[] = []
		let result = value.replace(/`([^`]+)`/g, (_match, code: string) => {
			const token = `@@CODE_${codeParts.length}@@`
			codeParts.push(
				`<code class="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[0.85em]">${code}</code>`,
			)
			return token
		})

		result = result
			.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-bold">$1</strong>')
			.replace(/_([^_]+)_/g, '<em class="italic">$1</em>')
			.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')

		// Restaurar placeholders de enlaces
		// Una URL es imagen si el texto del enlace sugiere foto/imagen (el agente usa "Ver imagen")
		result = result.replace(/@@LINK_(\d+)@@/g, (_match, idx: string) => {
			const link = links[parseInt(idx, 10)]
			if (!link) return ''
			const isImage = /imagen|photo|foto|ver\s+imagen/i.test(link.text) ||
				/\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i.test(link.url)
			if (isImage) {
				return `<img src="${link.url}" alt="${link.text}" class="mt-3 w-full max-w-sm rounded-2xl object-cover shadow-2" loading="lazy">`
			}
			return `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="font-semibold text-primary underline underline-offset-2 hover:no-underline">${link.text}</a>`
		})

		// Restaurar código inline
		codeParts.forEach((code, i) => {
			result = result.replace(`@@CODE_${i}@@`, code)
		})

		return result
	}

	/**
	 * Detecta líneas de bullet con • o - o * y devuelve el texto del ítem.
	 */
	private getBulletItem(line: string): string | null {
		const match = line.match(/^\s*[•\-\*\+]\s+(.+)$/)
		return match?.[1] ?? null
	}

	/**
	 * Detecta líneas de lista numerada y devuelve el texto del ítem.
	 */
	private getOrderedItem(line: string): string | null {
		const match = line.match(/^\s*\d+[.)]\s+(.+)$/)
		return match?.[1] ?? null
	}

	/**
	 * Método para escape html.
	 */
	private escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;')
	}
}
