import { Observable } from 'rxjs'
import { BaseEntity } from './base.model'

export interface IBaseRepository<T extends BaseEntity> {
	getById(id: string): Observable<T | null>
}
