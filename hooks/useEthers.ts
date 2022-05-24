import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { ethers } from 'ethers'

const useEthers = (): [(signer:ethers.Signer, message: string) => Promise<string>] => {
	const signText = async (signer:ethers.Signer, message: string): Promise<string> => {
		console.log(signer)
		if(!signer) throw "Signer not Present"
		const sign = await signer.signMessage(message)

		return sign
	}

	return [signText]
}

export default useEthers