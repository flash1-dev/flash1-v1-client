/**
 * Simple JavaScript example demonstrating authentication with private WebSockets channels.
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ethers } from 'ethers';
import WebSocket from 'ws';

import { Flash1Client, ClientOptions } from '../src/flash1-client';
import { RequestMethod } from '../src/lib/axios';

const PUBLIC_KEY = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
const API_HOST = 'http://localhost:8080';
const WS_HOST = 'ws://localhost:8080';
const PRIVATE_WS_URI = '/api/ws/v1/private/subscribeinfo';

(async () => {
  // ===== Initialize wallet ======
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const options: ClientOptions = {
    networkId: 1,
    signer: wallet, // await (new wagmi.InjectedConnector()).getSigner()
  };
  const client = new Flash1Client(API_HOST, options);
  const apiCreds = await client.onboarding.recoverDefaultApiCredentials(
    PUBLIC_KEY,
  );
  client.apiKeyCredentials = apiCreds;

  const timestamp = new Date().toISOString();
  const signature = client.private.sign({
    requestPath: '/api/ws/v1/private/subscribeinfo',
    method: RequestMethod.GET,
    isoTimestamp: timestamp,
  });

  const ws = new WebSocket(`${WS_HOST}${PRIVATE_WS_URI}`);

  ws.on('message', (message) => {
    console.log('<', message);
  });

  ws.on('open', () => {
    // ===== Send Message With Authentication ======
    const msg = {
      subs: 'SOME_CHANNEL_ID',
      message: 'TradeNotificationSubAdd',
      apiKey: apiCreds.key,
      signature,
      timestamp,
      passphrase: apiCreds.passphrase,
    };
    ws.send(JSON.stringify(msg));
  });

  ws.on('error', (err) => {
    console.log(`Error > ${err}`);
  });

  ws.on('message', (msg) => {
    console.log(`Message > ${msg}`);
  });

  ws.on('close', () => {
    console.log('Connection closed');
  });
})();
