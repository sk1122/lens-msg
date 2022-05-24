import { useEffect, useState } from "react"
import { gql } from "@apollo/client"
import { apolloClient } from "../apollo-client"
import useEthers from "./useEthers";
import { ethers } from "ethers";

const GET_CHALLENGE = `
  query($request: ChallengeRequest!) {
    challenge(request: $request) { text }
  }
`;

const AUTHENTICATION = `
  mutation($request: SignedAuthChallenge!) { 
    authenticate(request: $request) {
      accessToken
      refreshToken
    }
 }
`;

const VERIFY = `
  query($request: VerifyRequest!) {
    verify(request: $request)
  }
`

const useAuth = (): [(address: string, signer: ethers.Signer) => Promise<any>] => {
	const [address, setAddress] = useState()
	const [authenticationToken, setAuthenticationToken] = useState("")

	const [signText] = useEthers()

	const getChallenge = (address: string) => {
		return apolloClient.query({
			query: gql(GET_CHALLENGE),
			variables: {
				request: {
					address,
				}
			}
		})
	}

	const authenticate = (address: string, signature: string) => {
		console.log(address, signature)
		return apolloClient.mutate({
			mutation: gql(AUTHENTICATION),
			variables: {
				request: {
					address,
					signature
				}
			}
		})
	}

	const verify = () => {
		if(!authenticationToken) throw "No Authentication Token"
		return apolloClient.query({
			query: gql(VERIFY),
			variables: {
				request: {
					accessToken: authenticationToken,
				}
			}
		})
	}

	const login = async (address: string, signer: ethers.Signer) => {
		const challenge = await getChallenge(address)

		const signature = await signText(signer, challenge.data.challenge.text)

		const accessTokens = await authenticate(address, signature)

		setAuthenticationToken(accessTokens.data.authenticate.accessToken)

		return accessTokens.data
	}
	

	return [login]
}

export default useAuth