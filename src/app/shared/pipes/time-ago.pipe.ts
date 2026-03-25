import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';

@Pipe({
	name: 'timeAgo',
	standalone: true,
	pure: false,
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
	private timer: ReturnType<typeof setTimeout> | null = null;

	constructor(private changeDetectorRef: ChangeDetectorRef) { }

	transform(value: Date | string | number): string {
		this.clearTimer();
		const time = new Date(value);
		const now = new Date();
		const seconds = Math.floor((now.getTime() - time.getTime()) / 1000);

		const { text, nextUpdate } = this.format(seconds);
		this.scheduleUpdate(nextUpdate);
		return text;
	}


	/**
	 * @param seconds - El número de segundos transcurridos desde la fecha dada.
	 * @returns Un objeto con el texto formateado y el tiempo en segundos para la próxima actualización.
	 * @description Lo suyo seria cambiar el texto a formato internacionalizado, pero por ahora lo dejo así para
	 * no complicar el ejemplo. La función calcula el texto a mostrar basado en el número de segundos transcurridos
	 *  y también determina cuándo debería actualizarse el texto para mantenerlo preciso.
	 * @author Antonio Lorenzo
	 */
	private format(seconds: number): { text: string; nextUpdate: number } {
		if (seconds < 0) return { text: 'ahora', nextUpdate: 60 };
		if (seconds < 45) return { text: 'ahora mismo', nextUpdate: 45 - seconds };
		if (seconds < 90) return { text: '1 min', nextUpdate: 90 - seconds };

		if (seconds < 3600) {
			const m = Math.round(seconds / 60);
			return { text: `${m} min`, nextUpdate: 60 };
		}

		if (seconds < 7200) return { text: '1 h', nextUpdate: 3600 };

		if (seconds < 86400) {
			const h = Math.round(seconds / 3600);
			return { text: `${h} h`, nextUpdate: 3600 };
		}

		if (seconds < 172800) return { text: 'hace 24 horas', nextUpdate: 86400 };

		if (seconds < 2592000) {
			const d = Math.round(seconds / 86400);
			return { text: `${d} días`, nextUpdate: 86400 };
		}

		if (seconds < 31536000) {
			const mo = Math.round(seconds / 2592000);
			return { text: `${mo} mes${mo > 1 ? 'es' : ''}`, nextUpdate: 86400 };
		}

		const y = Math.round(seconds / 31536000);
		return { text: `${y} año${y > 1 ? 's' : ''}`, nextUpdate: 86400 };
	}

	/* Programa la próxima actualización del texto */
	private scheduleUpdate(seconds: number): void {
		this.timer = setTimeout(() => {
			this.changeDetectorRef.markForCheck();
		}, seconds * 1000);
	}

	/* Limpia el temporizador */
	private clearTimer(): void {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}

	/* Limpia el temporizador al destruir la instancia del pipe */
	ngOnDestroy() {
		if (this.timer) {
			clearTimeout(this.timer);
		}
	}
}
