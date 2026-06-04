import { Observable } from 'rxjs'

/**
 * Repositorio de datos para ipostmedia.
 */
export interface IPostMediaRepository {
	/**
	 * Método para upload imagen.
	 */
	uploadImage(path: string, file: File): Observable<string>
}
