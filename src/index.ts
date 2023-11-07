import { Abi, AccountInterface, Call, Invocation, InvocationsDetailsWithNonce, InvocationsSignerDetails } from 'starknet'
import { transaction } from 'starknet'

interface WalnutTransactionLog {
	chain_id: string
	wallet_address: string
	calldata: Invocation['calldata']
	nonce: number
	max_fee: number
	version: number
	cairo_version: string
}

async function sendLog(log: WalnutTransactionLog, apiKey: string) {
	const url = 'https://api.walnut.dev/v1/simulate'
	try {
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(log),
			headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
		})
	} catch {}
}

export function addWalnutLogs({ account, apiKey }: { account: AccountInterface; apiKey: string }) {
	const originalMethod = account.signer.signTransaction
	account.signer.signTransaction = async function (...args: [transactions: Call[], transactionsDetail: InvocationsSignerDetails, abis?: Abi[]]) {
		const transactions = args[0]
		const transactionsDetail = args[1]
		const log: WalnutTransactionLog = {
			chain_id: transactionsDetail.chainId,
			wallet_address: transactionsDetail.walletAddress,
			calldata: transaction.getExecuteCalldata(transactions, transactionsDetail.cairoVersion),
			nonce: Number(transactionsDetail.nonce),
			max_fee: Number(transactionsDetail.maxFee),
			version: Number(transactionsDetail.version),
			cairo_version: transactionsDetail.cairoVersion,
		}
		sendLog(log, apiKey)
		return originalMethod.apply(this, args)
	}
	return account
}
