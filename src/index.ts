import { AccountInterface, Invocation, InvocationsDetailsWithNonce } from 'starknet'

interface WalnutTransactionLog {
	chain_id: number
	contract_address: string
	calldata: Invocation['calldata']
	nonce: number
	max_fee?: number
	version?: number
}

async function sendLog(log: WalnutTransactionLog, apiKey: string) {
	const url = 'http://127.0.0.1:3000/simulate'
	try {
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(log),
			headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
		})
	} catch {}
}

export function addWalnutLogs({ account, apiKey, chainId }: { account: AccountInterface; apiKey: string; chainId: number }) {
	const originalMethod = account.invokeFunction
	account.invokeFunction = async function (...args: [functionInvocation: Invocation, details: InvocationsDetailsWithNonce]) {
		const functionInvocation = args[0]
		const details = args[1]
		const log: WalnutTransactionLog = {
			chain_id: chainId,
			contract_address: functionInvocation.contractAddress,
			calldata: functionInvocation.calldata,
			nonce: Number(details.nonce),
			max_fee: Number(details.maxFee),
			version: Number(details.version),
		}
		sendLog(log, apiKey)
		return originalMethod.apply(this, args)
	}
	return account
}
