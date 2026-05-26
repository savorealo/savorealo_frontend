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
	{ value: 'SPAM',     label: 'report.cat.spam.label',     icon: 'pi pi-megaphone',            description: 'report.cat.spam.desc' },
	{ value: 'HATE',     label: 'report.cat.hate.label',     icon: 'pi pi-ban',                  description: 'report.cat.hate.desc' },
	{ value: 'VIOLENCE', label: 'report.cat.violence.label', icon: 'pi pi-exclamation-triangle', description: 'report.cat.violence.desc' },
	{ value: 'SEXUAL',   label: 'report.cat.sexual.label',   icon: 'pi pi-eye-slash',            description: 'report.cat.sexual.desc' },
	{ value: 'FRAUD',    label: 'report.cat.fraud.label',    icon: 'pi pi-shield',               description: 'report.cat.fraud.desc' },
	{ value: 'OTHER',    label: 'report.cat.other.label',    icon: 'pi pi-question-circle',      description: 'report.cat.other.desc' },
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
