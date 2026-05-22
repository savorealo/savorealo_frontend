import { InMemoryCache } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { HttpLink } from 'apollo-angular/http'
import { inject } from '@angular/core'
import { ENVIRONMENT } from '@core/tokens/environment.token'
import { SupabaseService } from './supabase.service'

export function apolloOptionsFactory() {
	const httpLink = inject(HttpLink)
	const env = inject(ENVIRONMENT)
	const supabase = inject(SupabaseService)
	const http = httpLink.create({ uri: `${env.apiUrl}/graphql` })
	const auth = setContext(async (_, { headers }) => {
		const { data: { session } } = await supabase.client.auth.getSession()
		const token = session?.access_token

		return {
			headers: {
				...headers,
				apikey: supabase.apiKey,
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		}
	})

	return {
		link: auth.concat(http),
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
