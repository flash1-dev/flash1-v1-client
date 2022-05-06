/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-floating-promises */
import { ethers } from 'ethers';
import format from 'pretty-format';

import { Flash1Client, ClientOptions } from '../src/flash1-client';
import { SigningMethod, OnboardingActionString } from '../src/types';

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

  // ===== Create stakex key-pair ======
  const starkKeyObj = await client.onboarding.deriveStarkKey(PUBLIC_KEY);
  console.log('User stark keys: ', format(starkKeyObj));

  // ===== Generate the onboarding signature ======
  const onboardingSignature = await client.onboarding.onBoardingSigner.sign(
    PUBLIC_KEY,
    SigningMethod.TypedData,
    { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
  );
  console.log('Onboarding signature: ', onboardingSignature);

  // ===== Create new user and get api credentials ======
  const createUserResponse = await client.onboarding.createUser(
    {
      starkKey: starkKeyObj.publicKey,
      starkKeyYCoordinate: starkKeyObj.publicKeyYCoordinate,
    },
    PUBLIC_KEY,
    onboardingSignature,
    SigningMethod.TypedData,
  );
  console.log('Create user response: ', format(createUserResponse));

  // ===== Make a request to an authenticated endpoint ======
  const authOptions: ClientOptions = {
    networkId: 1,
    starkPrivateKey: starkKeyObj.privateKey,
    apiKeyCredentials: createUserResponse.apiKey,
    signer: wallet,
  };
  const authenticatedClient = new Flash1Client(host, authOptions);
  const response = await authenticatedClient.private.getOpenOrders();
  console.log('Open orders: ', format(response));
})();
