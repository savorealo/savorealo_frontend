import { inject, Injectable } from '@angular/core'
import { from, Observable, switchMap, throwError } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { REPORT_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

/**
 * Tipo de dato personalizado para reportcategory.
 */
export type ReportCategory = 'SPAM' | 'HATE' | 'VIOLENCE' | 'SEXUAL' | 'FRAUD' | 'OTHER'

/**
 * Interfaz que define la estructura o contrato de datos para reportcategoryoption.
 */
export interface ReportCategoryOption {
	/**
	 * Propiedad para gestionar valor.
	 */
	value: ReportCategory
	/**
	 * Propiedad para gestionar label.
	 */
	label: string
	/**
	 * Propiedad para gestionar icon.
	 */
	icon: string
	/**
	 * Propiedad para gestionar descripción.
	 */
	description: string
}

/**
 * Variable o constante para r e p o r t c a t e g o r i e s.
 */
export const REPORT_CATEGORIES: ReportCategoryOption[] = [
	{ value: 'SPAM',     label: 'report.cat.spam.label',     icon: 'pi pi-megaphone',            description: 'report.cat.spam.desc' },
	{ value: 'HATE',     label: 'report.cat.hate.label',     icon: 'pi pi-ban',                  description: 'report.cat.hate.desc' },
	{ value: 'VIOLENCE', label: 'report.cat.violence.label', icon: 'pi pi-exclamation-triangle', description: 'report.cat.violence.desc' },
	{ value: 'SEXUAL',   label: 'report.cat.sexual.label',   icon: 'pi pi-eye-slash',            description: 'report.cat.sexual.desc' },
	{ value: 'FRAUD',    label: 'report.cat.fraud.label',    icon: 'pi pi-shield',               description: 'report.cat.fraud.desc' },
	{ value: 'OTHER',    label: 'report.cat.other.label',    icon: 'pi pi-question-circle',      description: 'report.cat.other.desc' },
]

/**
 * Servicio que provee la lógica de negocio para los reportes de contenido.
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {
	/**
	 * Propiedad para gestionar repo.
	 */
	private readonly repo = inject(REPORT_REPOSITORY)
	/**
	 * Propiedad para gestionar supabase.
	 */
	private readonly supabase = inject(SupabaseService)

	/**
	 * Método para crear report.
	 */
	createReport(postId: string, category: ReportCategory, detail: string | null): Observable<void> {
		return from(this.supabase.client.auth.getUser()).pipe(
			switchMap(({ data: { user } }) => {
				if (!user) return throwError(() => new Error('Debes iniciar sesión para reportar contenido'))
				return this.repo.createReport(postId, user.id, category, detail)
			}),
		)
	}
}
