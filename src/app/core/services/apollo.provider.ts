import { InMemoryCache } from '@apollo/client/core'
import { HttpLink } from 'apollo-angular/http'
import { inject } from '@angular/core'
import { ENVIRONMENT } from '@core/tokens/environment.token'

export function apolloOptionsFactory() {
	const httpLink = inject(HttpLink)
	const env = inject(ENVIRONMENT)

	return {
		link: httpLink.create({ uri: `${env.apiUrl}/graphql` }),
		cache: new InMemoryCache({
			typePolicies: {
				// __typename as returned by the backend GraphQL schema
				posts: { keyFields: ['id'] },
				users: { keyFields: ['id'] },
			},
		}),
		connectToDevTools: !env.production,
		defaultOptions: {
			watchQuery: { fetchPolicy: 'cache-and-network' as const },
		},
	}
}
