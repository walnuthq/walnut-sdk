import { Abi, AccountInterface, AllowArray, Call, Invocation, InvocationsDetails, InvocationsDetailsWithNonce, InvocationsSignerDetails } from 'starknet'
import { transaction } from 'starknet'

interface WalnutTransactionLog {
	chain_id: string
	wallet_address: string
	calldata: Invocation['calldata']
	nonce: number
	max_fee: number
	version: number
	cairo_version?: string
}

async function sendLog(apiKey: string, account: any, calls: AllowArray<Call>, transactionsDetail?: InvocationsDetails | undefined) {
	const transactions = Array.isArray(calls) ? calls : [calls]
	const nonce = Number(transactionsDetail?.nonce ?? (await account.getNonce()))
	const maxFee =
		transactionsDetail?.maxFee ?? transactionsDetail ? await account.getSuggestedMaxFee({ type: 'INVOKE', payload: calls }, transactionsDetail) : undefined
	// const version = toBN(transactionVersion)
	const chainId = await account.getChainId()
	const log: WalnutTransactionLog = {
		chain_id: chainId,
		wallet_address: account.address,
		calldata: transaction.fromCallsToExecuteCalldata(transactions),
		nonce,
		max_fee: maxFee,
		version: 1,
		// cairo_version: transactionsDetail.cairoVersion,
	}
	const url = 'https://api.walnut.dev/v1/simulate'
	try {
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(log),
			headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
		})
	} catch {}
}

export function addWalnutLogs<T>({ account, apiKey }: { account: T & { execute: AccountInterface['execute']; isWalnutLogsAdded?: boolean }; apiKey: string }) {
	if (account.isWalnutLogsAdded) return account as T
	const originalExecuteMethod = account.execute
	account.execute = function (...args: [calls: AllowArray<Call>, abis?: Abi[] | undefined, transactionsDetail?: InvocationsDetails | undefined]) {
		const calls = args[0]
		const transactionsDetail = args[2]
		sendLog(apiKey, account, calls, transactionsDetail)
		return originalExecuteMethod.apply(this, args)
	}
	account.isWalnutLogsAdded = true
	return account as T
}
