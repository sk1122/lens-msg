import { ethers } from 'ethers'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import useEthers from '../hooks/useEthers'
import useProfile from '../hooks/useProfile'
import Followers from '../components/followers'
import LitJsSdk from 'lit-js-sdk'
import { apolloClient, apolloClient2 } from '../apollo-client'
import { gql } from '@apollo/client'
import { create } from 'ipfs-http-client'

const QUERY = gql`
query NFTs($owner: String){
  nfts(where: {owner: $owner}) {
    id
    owner
    uri
  }
}
`

const GET_PROFILE = gql`
query Profiles($request: ProfileQueryRequest!) {
  profiles(request: $request) {
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

const client = create({
  url: 'https://ipfs.infura.io:5001/api/v0'
})

const Home: NextPage = () => {
  const [signText] = useEthers()
  const [signer, setSigner] = useState<ethers.Signer>()
  const [address, setAddress] = useState('')
  const [toLens, setToLens] = useState('sk1122_.lens')
  const [message, setMessage] = useState('')
  const [receivedMessage, setReceivedMessage] = useState('')
  const [receiver, setReceiver] = useState('')

  const checkWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const accounts = await ethereum.request({ method: "eth_accounts" });

        if (accounts.length !== 0) {
          setAddress(accounts[0])
          const provider = new ethers.providers.Web3Provider(ethereum)
          const signer = await provider.getSigner()
          setSigner(signer)
          console.log(accounts[0]);
        } else {
          console.log("Do not have access");
        }
      } else {
        console.log("Install Metamask");
      }
    } catch (e) {
      console.log(e);
    }
  };

  const authenticate = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length !== 0) {
          setAddress(accounts[0]);
          const provider = new ethers.providers.Web3Provider(ethereum)
          const signer = await provider.getSigner()
          setSigner(signer)
          console.log("Found");
        } else {
          console.log("Not Found");
        }
      } else {
        console.log("Install Metamask");
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    checkWalletIsConnected()
  }, [])

  const [login] = useAuth()
  const [profile, setProfile, followers, getProfile, getFollowers] = useProfile()

  useEffect(() => {
    getProfile(address)
  }, [address])

  useEffect(() => console.log(followers), [followers])

  useEffect(() => {
    (async () => {
      const client = new LitJsSdk.LitNodeClient()
      await client.connect()
      window.litNodeClient = client
    })()
  }, [])

  const [encrypted, setEncrypted] = useState('')
  const [key, setKey] = useState('')

  const encrypt = async (sender: string, message: string) => {
    const handle = await apolloClient.query({
      query: GET_PROFILE,
      variables: {
        request: { handles: [toLens], limit: 1 }
      }
    })

    console.log(handle.data)
    const receiver = handle.data.profiles.items[0].ownedBy
    console.log(receiver)
    
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: 'polygon'})
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      message
    );
    
    
    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: "polygon",
        method: '',
        parameters: [
          ':userAddress',
        ],
        returnValueTest: {
          comparator: '=',
          value: receiver
        }
      }
    ]
    console.log(accessControlConditions)

    const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: "polygon",
    });

    const file = await client.add(encryptedString)
    const file1 = await client.add(JSON.stringify(encryptedSymmetricKey))
    console.log(file, file1, "dsa")
    const uri = btoa(JSON.stringify({
      message: file.path,
      key: file1.path,
      sender: address
    }))

    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }],
    });

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = await provider.getSigner()
    const contract = new ethers.Contract('0x930DCb0D01bF474E9B5a47e38Fc8E9eA6B0D6Ca4', ['function safeMint(address to, string memory uri) public'], signer)

    await contract.safeMint(receiver, uri)
  }

  const decrypt = async () => {
    const handle = await apolloClient.query({
      query: GET_PROFILE,
      variables: {
        request: { handles: [toLens], limit: 1 }
      }
    })

    const receiver = handle.data.profiles.items[0].ownedBy
    
    const nfts = await apolloClient2.query({
      query: QUERY,
      variables: {
        owner: receiver
      }
    })
    console.log(nfts.data.nfts)
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: 'polygon'})

    // for(let i = 0; i < nfts.data.nfts; i++) {
      console.log(nfts.data)
      const data = JSON.parse(atob(nfts.data.nfts[nfts.data.nfts.length - 1].uri))
      // @ts-ignore
      console.log(data)
      let arr = await fetch(`https://ipfs.infura.io/ipfs/${data.key}`)
      //@ts-ignore
      arr = await arr.json()
      let arr1 = await fetch(`https://ipfs.infura.io/ipfs/${data.message}`)
      //@ts-ignore
      arr1 = await arr1.blob()
      let arr2 = Object.values(arr)
      const accessControlConditions = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: "polygon",
          method: '',
          parameters: [
            ':userAddress',
          ],
          returnValueTest: {
            comparator: '=',
            value: address
          }
        }
      ]
      console.log(accessControlConditions)
      const symmetricKey = await window.litNodeClient.getEncryptionKey({
        accessControlConditions,
        // Note, below we convert the encryptedSymmetricKey from a UInt8Array to a hex string.  This is because we obtained the encryptedSymmetricKey from "saveEncryptionKey" which returns a UInt8Array.  But the getEncryptionKey method expects a hex string.
        // @ts-ignore
        toDecrypt: LitJsSdk.uint8arrayToString(new Uint8Array(arr2), "base16"),
        chain: "polygon",
        authSig
      })
      console.log(data.message)
      const decryptedString = await LitJsSdk.decryptString(
        arr1,
        symmetricKey
      );
      setReceivedMessage(decryptedString)
    // }
  }
  
  useEffect(() => decrypt(), [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>LensMessage</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='w-full h-screen flex flex-col justify-center items-center'>
        <div className='h-28 w-full bg-black flex justify-between'>
          <h1 className='font-bold'>
            LensMsg
          </h1>
          <div className='flex justify-center items-center space-x-5'>
            <p>UO</p>
            <p>UO</p>
            <p>UO</p>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center w-full h-full">
          <button onClick={() => authenticate()}>Connect Wallet</button>
          
          <select value={toLens} onChange={(e) => setToLens(e.target.value)}>
            {followers && followers.map((follower: any) => {
              return <option value={follower.wallet.defaultProfile.handle} key={follower.wallet.defaultProfile.handle}>{follower.wallet.defaultProfile.handle}</option>
            })}
            <option value='sk1122_.lens'>sk1122_.lens</option>
          </select>
            <input type="text" value={message} className="border-2" onChange={(e) => setMessage(e.target.value)} placeholder='Message' />
            <button onClick={() => encrypt(address, message)}>Send Message</button>
            <button onClick={() => decrypt()}>decrypt any messages</button>
        </div>

        {toLens && 
          <div>
            {receivedMessage}
          </div>
        }
      </main>
    </div>
  )
}

export default Home
