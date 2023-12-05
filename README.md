# Walnut SDK Documentation

Welcome to the Walnut SDK documentation!

Use the Walnut SDK to monitor Starknet transactions within your decentralized application (dApp), detect any potential errors, and resolve them effectively using the Walnut Debugger designed specifically for Starknet.

## Installation

To get started with Walnut SDK, you can install it using npm:

```
# Using npm
npm install @walnuthq/sdk
```

## Get your API KEY
Before you can start using the Walnut SDK, you need to request access to Walnut on walnut.dev to obtain your API KEY.

1. Visit [walnut.dev](https://walnut.dev/) and sign up or request early access.
2. Once your request is approved, you will receive your unique API KEY.


## Usage

Use this snippet to integrate the Walnut SDK into your dApp and start sending unsigned transactions for monitoring:

```javascript
import { addWalnutLogs } from '@walnuthq/sdk';
import { connect } from 'get-starknet';

const starknetWindowObject = await connect();
const account = addWalnutLogs({
  account: starknetWindowObject.account,
  apiKey: '<WALNUT_API_KEY>',
});

// Unsigned transactions, even failed ones, will be sent to Walnut and simulated
// They will appear on the Walnut dashboard complete with traces and error messages
account.execute(someTransactions);
```
