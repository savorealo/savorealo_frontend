import { inject, Injectable } from '@angular/core'
import { Apollo } from 'apollo-angular'
import { from, map, Observable } from 'rxjs'
import { MY_SETTINGS_QUERY, UPDATE_SETTINGS_MUTATION } from '@graphql/feed.mutations'
import type { GqlUserSettings, ISettingsRepository } from './settings-repository'

@Injectable({ providedIn: 'root' })
export class SettingsGraphqlRepository implements ISettingsRepository {
	private readonly apollo = inject(Apollo)

	loadSettings(): Observable<GqlUserSettings | null> {
		return from(
			this.apollo.query<{ mySettings: GqlUserSettings | null }>({
				query: MY_SETTINGS_QUERY,
				fetchPolicy: 'network-only',
			}).toPromise(),
		).pipe(
			map(res => res?.data?.mySettings ?? null),
		)
	}

	saveSettings(patch: Partial<GqlUserSettings>): Observable<void> {
		return from(
			this.apollo.mutate<{ updateSettings: GqlUserSettings }>({
				mutation: UPDATE_SETTINGS_MUTATION,
				variables: {
					is_private:       patch.is_private,
					language:         patch.language,
					theme:            patch.theme,
					notify_likes:     patch.notify_likes,
					notify_comments:  patch.notify_comments,
					notify_follows:   patch.notify_follows,
				},
			}).toPromise(),
		).pipe(map(() => void 0))
	}
}
