import { gql } from "@apollo/client";
import { Dispatch, useEffect, useState } from "react"
import { apolloClient } from "../apollo-client";

const GET_PROFILES = `
query Profiles {
	profiles(request: { ownedBy: ["0x4e7f624c9f2dbc3bcf97d03e765142dd46fe1c46"], limit: 10 }) {
	  items {
		id
		name
		bio
		attributes {
		  displayType
		  traitType
		  key
		  value
		}
		metadata
		isDefault
		picture {
		  ... on NftImage {
			contractAddress
			tokenId
			uri
			verified
		  }
		  ... on MediaSet {
			original {
			  url
			  mimeType
			}
		  }
		  __typename
		}
		handle
		coverPicture {
		  ... on NftImage {
			contractAddress
			tokenId
			uri
			verified
		  }
		  ... on MediaSet {
			original {
			  url
			  mimeType
			}
		  }
		  __typename
		}
		ownedBy
		dispatcher {
		  address
		  canUseRelay
		}
		stats {
		  totalFollowers
		  totalFollowing
		  totalPosts
		  totalComments
		  totalMirrors
		  totalPublications
		  totalCollects
		}
		followModule {
		  ... on FeeFollowModuleSettings {
			type
			amount {
			  asset {
				symbol
				name
				decimals
				address
			  }
			  value
			}
			recipient
		  }
		  ... on ProfileFollowModuleSettings {
		   type
		  }
		  ... on RevertFollowModuleSettings {
		   type
		  }
		}
	  }
	  pageInfo {
		prev
		next
		totalCount
	  }
	}
  }
`

const GET_FOLLOWERS = `
  query($request: FollowersRequest!) {
    followers(request: $request) { 
             items {
        wallet {
          address
          defaultProfile {
            id
            name
            bio
            handle
            picture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                verified
              }
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
            }
            coverPicture {
              ... on NftImage {
                contractAddress
                tokenId
                uri
                verified
              }
              ... on MediaSet {
                original {
                  url
                  mimeType
                }
              }
            }
            ownedBy
            dispatcher {
              address
              canUseRelay
            }
            stats {
              totalFollowers
              totalFollowing
              totalPosts
              totalComments
              totalMirrors
              totalPublications
              totalCollects
            }
            followModule {
              ... on FeeFollowModuleSettings {
                type
                contractAddress
                amount {
                  asset {
                    name
                    symbol
                    decimals
                    address
                  }
                  value
                }
                recipient
              }
              ... on ProfileFollowModuleSettings {
               type
              }
              ... on RevertFollowModuleSettings {
               type
              }
            }
          }
          
        }
        totalAmountOfTimesFollowed
      }
      pageInfo {
        prev
        next
        totalCount
      }
        }
  }
`


const useProfile = (): [any, Dispatch<any>, any, (address: string) => Promise<any>, () => void] => {
	const [profile, setProfile] = useState<any>()
	const [followers, setFollowers] = useState<any>()

	const getProfile = async (address: string) => {
		const data = await apolloClient.query({
			query: gql(GET_PROFILES),
			variables: {
				request: {
					ownedBy: [address]
				}
			}
		})

		setProfile(data.data)
	}

	const getFollowers = async () => {
		const followers = await apolloClient.query({
			query: gql(GET_FOLLOWERS),
			variables: {
			  request: {
				profileId: profile.profiles.items[0].id,
				limit: 10
			  },
			},
		})

		setFollowers(followers.data.followers.items)
	}

	useEffect(() => {
		if(profile) {
			getFollowers()
		}
	}, [profile])

	return [profile, setProfile, followers, getProfile, getFollowers]
}

export default useProfile