import { Observable } from 'rxjs'

export interface IPostMediaRepository {
	uploadImage(path: string, file: File): Observable<string>
}
