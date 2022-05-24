import { ApolloClient, DefaultOptions, InMemoryCache } from "@apollo/client"

const API_URL = "https://api.lens.dev/"

export const apolloClient = new ApolloClient({
	uri: API_URL,
	cache: new InMemoryCache()
})

const defaultOptions: DefaultOptions = {
	watchQuery: {
	  fetchPolicy: 'no-cache',
	  errorPolicy: 'ignore',
	},
	query: {
	  fetchPolicy: 'no-cache',
	  errorPolicy: 'all',
	},
  }


export const apolloClient2 = new ApolloClient({
	uri: 'https://api.thegraph.com/subgraphs/name/sk1122/lens-msg',
	cache: new InMemoryCache(),
	defaultOptions: defaultOptions
})