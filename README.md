# Walnut SDK

Capture and monitor Starknet transactions effortlessly with Walnut SDK

## Installation

```
# using npm
npm install @walnuthq/sdk
```

## Usage

```javascript
import { addWalnutLogs } from '@walnuthq/sdk';
import { connect } from 'get-starknet';

const { account } = await connect();
const accountWithLogs = addWalnutLogs({ account, apiKey: '<WALNUT_API_KEY>' });

// Unsigned transactions, even failed ones, will be sent to Walnut and simulated
// They will appear on the Walnut dashboard complete with traces and error messages
accountWithLogs.execute(someTransactions);
```
