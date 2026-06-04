import { Observable } from 'rxjs'

/**
 * Repositorio de datos para ireport.
 */
export interface IReportRepository {
	/**
	 * Método para crear report.
	 */
	createReport(postId: string, reporterId: string, category: string, detail: string | null): Observable<void>
}
