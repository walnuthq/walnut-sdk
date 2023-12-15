import { AllowArray, CairoVersion, Call, Invocation, InvokeFunctionResponse, RpcProvider, transaction } from 'starknet'

interface WalnutTransactionLog {
	chain_id: string
	wallet_address: string
	calldata: Invocation['calldata']
	cairo_version?: string
	max_fee?: number
}

interface TransactionsDetail {
	maxFee?: any
}

interface RequiredAccountMethods {
	execute(transactions: AllowArray<Call>, abis?: unknown, transactionsDetail?: TransactionsDetail): Promise<InvokeFunctionResponse>
	getChainId(): Promise<string>
	address: string
	cairoVersion?: CairoVersion
	getCairoVersion?(classHash?: string): Promise<CairoVersion>
	isWalnutLogsAdded?: boolean
	provider?: { nodeUrl: string }
}

async function sendLog(apiKey: string, account: RequiredAccountMethods, calls: AllowArray<Call>, transactionsDetail?: TransactionsDetail) {
	try {
		if (!account.provider?.nodeUrl) return
		const transactions = Array.isArray(calls) ? calls : [calls]
		const chainId = await account.getChainId()
		const provider = new RpcProvider({
			nodeUrl: account.provider.nodeUrl,
		})
		const { cairo: cairo_version } = await provider.getContractVersion(account.address)
		const calldata = transaction.getExecuteCalldata(transactions, cairo_version)
		const max_fee = transactionsDetail?.maxFee ? Number(transactionsDetail?.maxFee) : undefined
		const log: WalnutTransactionLog = {
			chain_id: chainId,
			wallet_address: account.address,
			calldata,
			cairo_version,
			max_fee,
		}
		const url = 'https://api.walnut.dev/v1/simulate'
		fetch(url, {
			method: 'POST',
			body: JSON.stringify(log),
			headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
		})
	} catch {}
}

export function addWalnutLogs<T>({ account, apiKey }: { account: T & RequiredAccountMethods; apiKey: string }) {
	if (account.isWalnutLogsAdded) return account
	const originalExecuteMethod = account.execute
	account.execute = function (...args: [calls: AllowArray<Call>, abis?: unknown, transactionsDetail?: TransactionsDetail]) {
		const calls = args[0]
		const transactionsDetail = args[2]
		sendLog(apiKey, account, calls, transactionsDetail)
		return originalExecuteMethod.apply(this, args)
	}
	account.isWalnutLogsAdded = true
	return account
}

interface RequiredConnectorMethods {
	account(): Promise<RequiredAccountMethods>
}

export function addWalnutLogsToConnectors<T>({ connectors, apiKey }: { connectors: (T & RequiredConnectorMethods)[]; apiKey: string }) {
	return connectors.map((connector) => {
		const originalAccountMethod = connector.account
		connector.account = async function () {
			return addWalnutLogs({ account: await originalAccountMethod.apply(this), apiKey })
		}
		return connector
	})
}
