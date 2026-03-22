import { InMemoryCache } from '@apollo/client/core'
import { HttpLink } from 'apollo-angular/http'
import { inject } from '@angular/core'
import { ENVIRONMENT } from '@core/tokens/environment.token'

export function apolloOptionsFactory() {
	const httpLink = inject(HttpLink)
	const env = inject(ENVIRONMENT)

	return {
		link: httpLink.create({ uri: env.apiUrl }),
		cache: new InMemoryCache(),
		defaultOptions: {
			watchQuery: { fetchPolicy: 'cache-and-network' as const },
		},
	}
}
