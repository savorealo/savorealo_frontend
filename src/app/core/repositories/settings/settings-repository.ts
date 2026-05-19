import { Observable } from 'rxjs'

export interface GqlUserSettings {
	is_private: boolean
	language: string
	theme: string
	notify_likes: boolean
	notify_comments: boolean
	notify_follows: boolean
}

export interface ISettingsRepository {
	loadSettings(): Observable<GqlUserSettings | null>
	saveSettings(patch: Partial<GqlUserSettings>): Observable<void>
}
