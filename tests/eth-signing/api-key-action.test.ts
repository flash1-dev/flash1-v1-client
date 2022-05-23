import { ApiMethod } from '@flash1-exchange/starkex-lib';
import { ethers } from 'ethers';

import { SignEthPrivateAction } from '../../src/eth-signing';
import { SigningMethod } from '../../src/types';

// DEFAULT GANACHE ACCOUNT FOR TESTING ONLY -- DO NOT USE IN PRODUCTION.
const GANACHE_ADDRESS = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const GANACHE_PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';

// Note that this is the signature for SigningMethod.TypedData, but not SigningMethod.Hash.
const EXPECTED_SIGNATURE = ('0x1434a4c319dd55b6c245fbc83739ba41f9537cbe560c4783960b6da35ce45d951' +
'23928443ffc2d39f30dd011d57667ffb7c9eb89cfcd1157e70d0ed1b08121461b00');

const mockRequestNoBody = {
  requestPath: 'v3/test',
  method: ApiMethod.POST,
  body: '{}',
  timestamp: '2021-01-08T10:06:12.500Z',
};
const mockRequestWithBody = {
  ...mockRequestNoBody,
  body: JSON.stringify({ key: 'value', key2: 'value2' }),
};

let localSigner: SignEthPrivateAction;
let remoteSigner: SignEthPrivateAction;

describe('SignEthPrivateAction', () => {

  describe('with a local Ethereum private key', () => {

    beforeAll(() => {
      const wallet = new ethers.Wallet(GANACHE_PRIVATE_KEY);
      localSigner = new SignEthPrivateAction(wallet, 1);
    });

    it('sanity check', async () => {
      expect(GANACHE_ADDRESS).toEqual(new ethers.Wallet(GANACHE_PRIVATE_KEY).address);
    });

    it('signs and verifies using SigningMethod.Hash', async () => {
      const signature = await localSigner.sign(
        GANACHE_ADDRESS,
        SigningMethod.Hash,
        mockRequestNoBody,
      );
      expect(localSigner.verify(signature, GANACHE_ADDRESS, mockRequestNoBody)).toBe(true);
    });

    it('signs and verifies using SigningMethod.TypedData', async () => {
      const signature = await localSigner.sign(
        GANACHE_ADDRESS,
        SigningMethod.TypedData,
        mockRequestNoBody,
      );
      expect(localSigner.verify(signature, GANACHE_ADDRESS, mockRequestNoBody)).toBe(true);
      expect(signature).toBe(EXPECTED_SIGNATURE);
    });

    it('rejects an invalid signature', async () => {
      const signature = await localSigner.sign(
        GANACHE_ADDRESS,
        SigningMethod.Hash,
        mockRequestNoBody,
      );

      // Change the last character.
      const lastChar = signature.charAt(signature.length - 1);
      const newLastChar = lastChar === '0' ? '1' : '0';
      const invalidSignature = `${signature.slice(0, signature.length - 1)}${newLastChar}`;

      expect(localSigner.verify(invalidSignature, GANACHE_ADDRESS, mockRequestNoBody)).toBe(false);
    });
  });

  describe('with a web3 provider', () => {

    beforeAll(async () => {
      const wallet = new ethers.Wallet(GANACHE_PRIVATE_KEY);
      remoteSigner = new SignEthPrivateAction(wallet, 1);
    });

    it('signs and verifies using SigningMethod.Hash', async () => {
      const signature = await localSigner.sign(
        GANACHE_ADDRESS,
        SigningMethod.Hash,
        mockRequestNoBody,
      );
      expect(localSigner.verify(signature, GANACHE_ADDRESS, mockRequestNoBody)).toBe(true);
    });

    it('signs and verifies using SigningMethod.TypedData', async () => {
      const signature = await remoteSigner.sign(
        GANACHE_ADDRESS,
        SigningMethod.TypedData,
        mockRequestNoBody,
      );
      expect(remoteSigner.verify(signature, GANACHE_ADDRESS, mockRequestNoBody)).toBe(true);
      expect(signature).toBe(EXPECTED_SIGNATURE);
    });

    it('signs and verifies using SigningMethod.TypedData (with body)', async () => {
      const signature = await remoteSigner.sign(
        GANACHE_ADDRESS,
        SigningMethod.TypedData,
        mockRequestWithBody,
      );
      expect(remoteSigner.verify(signature, GANACHE_ADDRESS, mockRequestWithBody)).toBe(true);
    });
  });
});
