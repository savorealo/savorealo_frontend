import { inject, Injectable } from '@angular/core'
import { from, Observable, switchMap, throwError } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import { REPORT_REPOSITORY } from '@core/repositories/tokens/repository.tokens'

export type ReportCategory = 'SPAM' | 'HATE' | 'VIOLENCE' | 'SEXUAL' | 'FRAUD' | 'OTHER'

export interface ReportCategoryOption {
	value: ReportCategory
	label: string
	icon: string
	description: string
}

export const REPORT_CATEGORIES: ReportCategoryOption[] = [
	{ value: 'SPAM',     label: 'Spam',                icon: 'pi pi-megaphone',           description: 'Publicidad engañosa o contenido repetitivo' },
	{ value: 'HATE',     label: 'Odio o acoso',        icon: 'pi pi-ban',                 description: 'Discurso de odio, insultos o acoso a personas' },
	{ value: 'VIOLENCE', label: 'Violencia',           icon: 'pi pi-exclamation-triangle', description: 'Contenido violento o amenazas' },
	{ value: 'SEXUAL',   label: 'Contenido sexual',    icon: 'pi pi-eye-slash',           description: 'Desnudez o contenido sexual explícito' },
	{ value: 'FRAUD',    label: 'Estafa o fraude',     icon: 'pi pi-shield',              description: 'Intento de estafa, phishing o engaño' },
	{ value: 'OTHER',    label: 'Otro',                icon: 'pi pi-question-circle',     description: 'Otro motivo que no encaja arriba' },
]

@Injectable({ providedIn: 'root' })
export class ReportsService {
	private readonly repo = inject(REPORT_REPOSITORY)
	private readonly supabase = inject(SupabaseService)

	createReport(postId: string, category: ReportCategory, detail: string | null): Observable<void> {
		return from(this.supabase.client.auth.getUser()).pipe(
			switchMap(({ data: { user } }) => {
				if (!user) return throwError(() => new Error('Debes iniciar sesión para reportar contenido'))
				return this.repo.createReport(postId, user.id, category, detail)
			}),
		)
	}
}
