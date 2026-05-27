import { Observable } from 'rxjs'
import { BaseEntity } from './base.model'

/**
 * Repositorio de datos para ibase.
 */
export interface IBaseRepository<T extends BaseEntity> {
	/**
	 * Método para obtener por identificador.
	 */
	getById(id: string): Observable<T | null>
}
