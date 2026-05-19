import { Observable } from 'rxjs'

export interface IReportRepository {
	createReport(postId: string, reporterId: string, category: string, detail: string | null): Observable<void>
}
