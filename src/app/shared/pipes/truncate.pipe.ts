import { Pipe, PipeTransform } from '@angular/core'

@Pipe({
	name: 'truncate',
	standalone: true,
})
export class TruncateTextPipe implements PipeTransform {
	transform(value: string | null | undefined, limit = 280): string {
		if (!value) return ''
		if (value.length <= limit) return value
		return `${value.slice(0, Math.max(0, limit)).trimEnd()}...`
	}
}
