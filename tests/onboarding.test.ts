import { ethers } from 'ethers';

import Onboarding from '../src/modules/onboarding';

// DEFAULT GANACHE ACCOUNT FOR TESTING ONLY -- DO NOT USE IN PRODUCTION.
const GANACHE_ADDRESS = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const GANACHE_PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';

const EXPECTED_API_KEY_CREDENTIALS_MAINNET = {
  secret: 'FJal9X_o68GztwxDKPzLSNoSIbNWcVjXreCwCwTm',
  key: 'a4139502-231a-18c5-7332-d6c2f8104190',
  passphrase: 'Pn6O7NlFlXPU7GekZomZ',
};
const EXPECTED_STARK_KEY_PAIR_MAINNET = {
  publicKey: '023fdc1b2adf55afcfa7b6c9af35d27d4128a084a613157b762e2f87abb83a80',
  publicKeyYCoordinate: '062de810a15a5f50790d9c87eb83019a2d68ab19e98fafbd262d600df1a16660',
  privateKey: '077b73fed7bf763d3c99f9724b9df2acb86f0b529675fe89b74c9d670ac64d8d',
};
const EXPECTED_API_KEY_CREDENTIALS_ROPSTEN = {
  secret: 'gyB_UgsyofROvorQzVhwkTFqYmmd9s9OGTCXCGLv',
  key: 'aeef7272-ba8d-0b3d-2c02-161c72230f0b',
  passphrase: 'FfQ2adG7ydneS3JOplD4',
};
const EXPECTED_STARK_KEY_PAIR_ROPSTEN = {
  publicKey: '0464f315d6fc4a3a1e345f1d3836d3538f96a1377a47e61272c4ab63c9d545ec',
  publicKeyYCoordinate: '06fa328262fc7542ce776a70235e76280ab305fa6e632cbc195819065f7f97f9',
  privateKey: '031c0a807c594b0821b0191ab37332adbd5a097189b472812f89bb50d7bf15ee',
};

let onboardingMainnetRemote: Onboarding;
let onboardingRopstenRemote: Onboarding;
let onboardingMainnetLocal: Onboarding;
let onboardingRopstenLocal: Onboarding;

describe('Onboarding module', () => {

  describe('mainnet, with a web3 provider', () => {

    beforeAll(async () => {
      const wallet = new ethers.Wallet(GANACHE_PRIVATE_KEY);
      onboardingMainnetRemote = new Onboarding('http://example.com', wallet, 1);
    });

    it('derives the default STARK key pair', async () => {
      const keyPair = await onboardingMainnetRemote.deriveStarkKey(GANACHE_ADDRESS);
      expect(keyPair).toStrictEqual(EXPECTED_STARK_KEY_PAIR_MAINNET);
    });

    it('derives the default API key pair', async () => {
      const apiKey = await onboardingMainnetRemote.recoverDefaultApiCredentials(GANACHE_ADDRESS);
      expect(apiKey).toStrictEqual(EXPECTED_API_KEY_CREDENTIALS_MAINNET);
    });
  });

  describe('Ropsten, with a web3 provider', () => {

    beforeAll(async () => {
      const wallet = new ethers.Wallet(GANACHE_PRIVATE_KEY);
      onboardingRopstenRemote = new Onboarding('http://example.com', wallet, 3);
    });

    it('derives the default STARK key pair', async () => {
      const keyPair = await onboardingRopstenRemote.deriveStarkKey(GANACHE_ADDRESS);
      expect(keyPair).toStrictEqual(EXPECTED_STARK_KEY_PAIR_ROPSTEN);
    });

    it('derives the default API key pair', async () => {
      const apiKey = await onboardingRopstenRemote.recoverDefaultApiCredentials(GANACHE_ADDRESS);
      expect(apiKey).toStrictEqual(EXPECTED_API_KEY_CREDENTIALS_ROPSTEN);
    });
  });

  describe('mainnet, with a local Ethereum private key', () => {

    beforeAll(() => {
      const wallet = new ethers.Wallet(GANACHE_PRIVATE_KEY);
      onboardingMainnetLocal = new Onboarding('http://example.com', wallet, 1);
    });

    it('derives the default STARK key pair', async () => {
      const keyPair = await onboardingMainnetLocal.deriveStarkKey(GANACHE_ADDRESS);
      expect(keyPair).toStrictEqual(EXPECTED_STARK_KEY_PAIR_MAINNET);
    });

    it('derives the default API key pair', async () => {
      const apiKey = await onboardingMainnetLocal.recoverDefaultApiCredentials(GANACHE_ADDRESS);
      expect(apiKey).toStrictEqual(EXPECTED_API_KEY_CREDENTIALS_MAINNET);
    });
  });

  describe('Ropsten, with a local Ethereum private key', () => {

    beforeAll(() => {
      const wallet = new ethers.Wallet(GANACHE_PRIVATE_KEY);
      onboardingRopstenLocal = new Onboarding('http://example.com', wallet, 3);
    });

    it('derives the default STARK key pair', async () => {
      const keyPair = await onboardingRopstenLocal.deriveStarkKey(GANACHE_ADDRESS);
      expect(keyPair).toStrictEqual(EXPECTED_STARK_KEY_PAIR_ROPSTEN);
    });

    it('derives the default API key pair', async () => {
      const apiKey = await onboardingRopstenLocal.recoverDefaultApiCredentials(GANACHE_ADDRESS);
      expect(apiKey).toStrictEqual(EXPECTED_API_KEY_CREDENTIALS_ROPSTEN);
    });
  });
});
