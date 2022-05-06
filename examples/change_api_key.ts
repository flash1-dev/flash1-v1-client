/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ethers } from 'ethers';
import format from 'pretty-format';

import { Flash1Client, ClientOptions } from '../src/flash1-client';

const PUBLIC_KEY = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
const API_HOST = 'http://localhost:8080';

(async () => {
// ===== Initialize wallet ======
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const options: ClientOptions = {
    networkId: 1,
    signer: wallet, // await (new wagmi.InjectedConnector()).getSigner()
  };

  // ===== Initialize api client ======
  const host = API_HOST;
  const client = new Flash1Client(host, options);

  const currentApiKey = await client.onboarding.recoverDefaultApiCredentials(PUBLIC_KEY);
  console.log('Existing API Keys: ', format(currentApiKey));

  // ===== Revoke the current API key ======
  await client.ethPrivate.deleteApiKey(currentApiKey.key, PUBLIC_KEY);
  console.log('Deleted API key: ', currentApiKey.key);

  // ===== Create a new API key ======
  const newApiKeys = await client.ethPrivate.createApiKey(PUBLIC_KEY);
  console.log('New API Keys: ', format(newApiKeys));

  // ===== Generate the onboarding signature ======
  const newClient = new Flash1Client(host, {
    networkId: 1,
    signer: wallet,
    apiKeyCredentials: newApiKeys,
  });
  // ===== Make a request to an authenticated endpoint ======
  const response = await newClient.private.getOpenOrders();
  console.log('Open orders: ', format(response));
})();
