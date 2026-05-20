import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
	name: 'messageMarkdown',
	standalone: true,
})
export class MessageMarkdownPipe implements PipeTransform {
	transform(value: string | null | undefined): string {
		if (!value) return ''

		const lines = value
			.replace(/\r\n/g, '\n')
			.split('\n')

		const rendered: string[] = []
		let index = 0

		while (index < lines.length) {
			const unordered = this.getUnorderedItem(lines[index])
			if (unordered) {
				const items: string[] = []
				while (index < lines.length) {
					const item = this.getUnorderedItem(lines[index])
					if (!item) break
					items.push(`<li>${this.renderInline(this.escapeHtml(item))}</li>`)
					index++
				}
				rendered.push(`<ul class="my-1 list-disc space-y-1 pl-5">${items.join('')}</ul>`)
				continue
			}

			const ordered = this.getOrderedItem(lines[index])
			if (ordered) {
				const items: string[] = []
				while (index < lines.length) {
					const item = this.getOrderedItem(lines[index])
					if (!item) break
					items.push(`<li>${this.renderInline(this.escapeHtml(item))}</li>`)
					index++
				}
				rendered.push(`<ol class="my-1 list-decimal space-y-1 pl-5">${items.join('')}</ol>`)
				continue
			}

			rendered.push(this.renderLine(lines[index]))
			index++
		}

		return rendered.join('')
	}

	private renderLine(line: string): string {
		const escaped = this.escapeHtml(line)
		if (!escaped.trim()) return '<br>'

		const heading = escaped.match(/^(#{1,3})\s+(.+)$/)
		if (heading) {
			const level = heading[1].length
			const sizeClass = level === 1
				? 'text-base sm:text-lg'
				: level === 2
					? 'text-sm sm:text-base'
					: 'text-sm'

			return `<span class="mb-1 block ${sizeClass} font-black leading-snug">${this.renderInline(heading[2])}</span>`
		}

		return `<span class="block">${this.renderInline(escaped)}</span>`
	}

	private renderInline(value: string): string {
		const codeParts: string[] = []
		let rendered = value.replace(/`([^`]+)`/g, (_match, code: string) => {
			const token = `@@CODE_${codeParts.length}@@`
			codeParts.push(`<code class="rounded-md bg-surface-container-high px-1.5 py-0.5 font-mono text-[0.85em] font-bold">${code}</code>`)
			return token
		})

		rendered = rendered
			.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-black">$1</strong>')
			.replace(/\*([^*]+)\*/g, '<strong class="font-black">$1</strong>')
			.replace(/_([^_]+)_/g, '<em class="italic">$1</em>')

		codeParts.forEach((code, index) => {
			rendered = rendered.replace(`@@CODE_${index}@@`, code)
		})

		return rendered
	}

	private getUnorderedItem(line: string): string | null {
		const match = line.match(/^\s*[-+*]\s+(.+)$/)
		return match?.[1] ?? null
	}

	private getOrderedItem(line: string): string | null {
		const match = line.match(/^\s*\d+[.)]\s+(.+)$/)
		return match?.[1] ?? null
	}

	private escapeHtml(value: string): string {
		return value
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;')
	}
}
