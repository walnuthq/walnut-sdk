import { AllowArray, CairoVersion, Call, Invocation, InvokeFunctionResponse, RpcProvider, transaction } from 'starknet'
import * as Sentry from '@sentry/browser'

const WALNUT_RPC_URL = 'https://api.walnut.dev/rpc/'
const WALNUT_SIMULATE_URL = 'https://api.walnut.dev/v1/simulate'
const SENTRY_DSN = 'https://6949783457ebec08625d15dd589d93f9@o1164952.ingest.sentry.io/4506455891771392'

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
}

let isSentryInitialized = false

async function sendLog(apiKey: string, account: RequiredAccountMethods, calls: AllowArray<Call>, transactionsDetail?: TransactionsDetail) {
	if (!isSentryInitialized) {
		Sentry.init({
			dsn: SENTRY_DSN,
			autoSessionTracking: false,
			sendClientReports: false,
			defaultIntegrations: false,
			release: process.env.VERSION,
		})
		isSentryInitialized = true
	}

	let chainId: string

	try {
		const transactions = Array.isArray(calls) ? calls : [calls]
		chainId = await account.getChainId()
		const provider = new RpcProvider({
			nodeUrl: WALNUT_RPC_URL + chainId,
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
		const response = await fetch(WALNUT_SIMULATE_URL, {
			method: 'POST',
			body: JSON.stringify(log),
			headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
		})
		if (response.status !== 200) throw Error('Failed to send log')
	} catch (error) {
		Sentry.withScope((scope) => {
			scope.setTag('chain_id', chainId)
			scope.setContext('additional_data', { app_api_key: apiKey })
			scope.setUser({ wallet_address: account?.address })
			Sentry.captureException(error, scope)
		})
	}
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
