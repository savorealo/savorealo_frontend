import { inject, Injectable } from '@angular/core'
import { from, map, Observable } from 'rxjs'
import { SupabaseService } from '@core/services/supabase.service'
import type { IReportRepository } from './report-repository'

@Injectable({ providedIn: 'root' })
export class ReportSupabaseRepository implements IReportRepository {
	private readonly supabase = inject(SupabaseService)

	createReport(postId: string, reporterId: string, category: string, detail: string | null): Observable<void> {
		return from(
			this.supabase.client.from('content_reports').insert({
				post_id: postId,
				reporter_id: reporterId,
				category,
				detail: detail?.trim() || null,
			}),
		).pipe(
			map(({ error }) => {
				if (error) {
					if (error.code === '23505') throw new Error('Ya has reportado este contenido')
					throw new Error(error.message)
				}
			}),
		)
	}
}
