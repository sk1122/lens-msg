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
import { apolloClient2 } from '../apollo-client'
import { gql } from '@apollo/client'

const QUERY = gql`
query NFTs($owner: String){
  nfts(where: {owner: $owner}) {
    id
    owner
    uri
  }
}
`

const Home: NextPage = () => {
  const [signText] = useEthers()
  const [signer, setSigner] = useState<ethers.Signer>()
  const [address, setAddress] = useState('')

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

  const encrypt = async (sender: string, receiver: string, message: string) => {
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: 'polygon'})
    const { encryptedString, symmetricKey } = await LitJsSdk.encryptString(
      message
    );
    
    console.log(JSON.parse(await encryptedString.text()), "dasassa")
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

    const encryptedSymmetricKey = await window.litNodeClient.saveEncryptionKey({
      accessControlConditions,
      symmetricKey,
      authSig,
      chain: "polygon",
    });

    const uri = btoa(JSON.stringify({
      message: JSON.stringify(encryptedString),
      key: JSON.stringify(encryptedSymmetricKey),
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

  const decrypt = async (encryptedSymmetricKey: any, receiver: string, encryptedString: string) => {
    const nfts = await apolloClient2.query({
      query: QUERY,
      variables: {
        owner: receiver
      }
    })
    console.log(nfts.data.nfts)
    const authSig = await LitJsSdk.checkAndSignAuthMessage({chain: 'polygon'})

    // for(let i = 0; i < nfts.data.nfts; i++) {
      const data = JSON.parse(atob(nfts.data.nfts[1].uri))
      // @ts-ignore
      const arr = new Uint8Array(Object.values(JSON.parse(data.key)))
      console.log(arr, 1)
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

      const symmetricKey = await window.litNodeClient.getEncryptionKey({
        accessControlConditions,
        // Note, below we convert the encryptedSymmetricKey from a UInt8Array to a hex string.  This is because we obtained the encryptedSymmetricKey from "saveEncryptionKey" which returns a UInt8Array.  But the getEncryptionKey method expects a hex string.
        // @ts-ignore
        toDecrypt: LitJsSdk.uint8arrayToString(arr, "base16"),
        chain: "polygon",
        authSig
      })
      console.log(data.message)
      const decryptedString = await LitJsSdk.decryptString(
        JSON.parse(data.message),
        symmetricKey
      );
      console.log(decryptedString)
    // }
  }

  const [message, setMessage] = useState('')
  const [receiver, setReceiver] = useState('')
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <Head>
        <title>LensMessage</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className='flex flex-col justify-center items-center'>
        {/* <button onClick={() => authenticate()}>Connect Wallet</button> */}
        {/* {address && <button onClick={() => login(address, signer as ethers.Signer)}>Login</button>}

        {followers && <Followers followers={followers}></Followers>} */}

        <input value={message} onChange={(e) => setMessage(e.target.value)} type="text" />
        <input value={receiver} onChange={(e) => setReceiver(e.target.value)} type="text" />

        <button onClick={() => encrypt(address, receiver, message)}>encrypt</button>
        <button onClick={() => decrypt(key, receiver, encrypted)}>decrypt</button>
      </main>
    </div>
  )
}

export default Home
