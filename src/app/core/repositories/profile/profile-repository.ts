import { Observable } from 'rxjs'

export interface GqlUpdateProfileResult {
	id: string
	username: string | null
	display_name: string | null
	avatar_url: string | null
}

export interface IProfileRepository {
	updateProfile(variables: Record<string, unknown>): Observable<GqlUpdateProfileResult>
	evictUserFromCache(userId: string): void
}
