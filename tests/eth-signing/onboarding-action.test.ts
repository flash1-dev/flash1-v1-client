import { ethers } from 'ethers';
import { SignOnboardingAction } from '../../src/eth-signing';
import {
  OnboardingActionString,
  SigningMethod,
} from '../../src/types';

let localSigner: SignOnboardingAction;
let localAccountAddress: string;
let remoteSigner: SignOnboardingAction;
let remoteAccountAddress: string;

// TODO: FIX Personal Sign tests!!!!

// DEFAULT GANACHE ACCOUNT FOR TESTING ONLY -- DO NOT USE IN PRODUCTION.
const GANACHE_ADDRESS = '0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1';
const GANACHE_PRIVATE_KEY = '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';

// IMPORTANT: This is the message used with the SigningMethod.PERSONAL singing method.
//            The message should not be changed at all since it's used to generated default keys.
// const EXPECTED_PERSONAL_MESSAGE = `{
//   "name": "flash1",
//   "version": "1.0",
//   "chainId": 1,
//   "action": "flash1 Onboarding",
//   "onlySignOn": "https://flash1.com"
// }`;

// Typed signature generated using web3.eth.personal().
const PERSONAL_SIGNATURE = (
  '0x12311bcc0280fe24e529bd16fa770a3eddb90ebca9f7d06e9ba11928f1d14dc8' +
  '7c2f6e5409137150feeaf37319ae2160996788528248090b56896d74d3ce5c3b1b03'
);

describe('SignOnboardingAction', () => {

  describe('without a web3 provider', () => {

    beforeAll(() => {
      const wallet = ethers.Wallet.createRandom();
      localSigner = new SignOnboardingAction(wallet, 1);
      localAccountAddress = wallet.address;
    });

    it('signs and verifies using SigningMethod.Hash', async () => {
      const signature = await localSigner.sign(
        localAccountAddress,
        SigningMethod.Hash,
        { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
      );
      expect(
        localSigner.verify(
          signature,
          localAccountAddress,
          { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
        ),
      ).toBe(true);
    });

    it.skip('verifies a message signed using SigningMethod.Personal', async () => {
      expect(
        localSigner.verify(
          PERSONAL_SIGNATURE,
          GANACHE_ADDRESS,
          { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
        ),
      ).toBe(true);
    });

    it('rejects an invalid signature', async () => {
      const signature = await localSigner.sign(
        localAccountAddress,
        SigningMethod.Hash,
        { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
      );

      // Change the last character.
      const lastChar = signature.charAt(signature.length - 1);
      const newLastChar = lastChar === '0' ? '1' : '0';
      const invalidSignature = `${signature.slice(0, signature.length - 1)}${newLastChar}`;

      expect(
        localSigner.verify(
          invalidSignature,
          localAccountAddress,
          { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
        ),
      ).toBe(false);
    });

    it('rejects if the message is different', async () => {
      const signature = await localSigner.sign(
        localAccountAddress,
        SigningMethod.Hash,
        { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
      );
      expect(
        localSigner.verify(
          signature,
          localAccountAddress,
          { action: OnboardingActionString.KEY_DERIVATION, onlySignOn: 'https://flash1.com' },
        ),
      ).toBe(false);
    });
  });

  describe('with a web3 provider', () => {

    beforeAll(async () => {
      const wallet = new ethers.Wallet(GANACHE_PRIVATE_KEY);
      remoteSigner = new SignOnboardingAction(wallet, 1);
      remoteAccountAddress = wallet.address;
    });

    it('signs and verifies using SigningMethod.Hash', async () => {
      const signature = await remoteSigner.sign(
        remoteAccountAddress,
        SigningMethod.Hash,
        { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
      );
      expect(
        remoteSigner.verify(
          signature,
          remoteAccountAddress,
          { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
        ),
      ).toBe(true);
    });

    it('signs and verifies using SigningMethod.TypedData', async () => {
      const signature = await remoteSigner.sign(
        remoteAccountAddress,
        SigningMethod.TypedData,
        { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
      );
      expect(
        remoteSigner.verify(
          signature,
          remoteAccountAddress,
          { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
        ),
      ).toBe(true);
    });

    it.skip('signs a message using SigningMethod.Personal', async () => {
      // // Mock the signing function since personal_sign is not supported by Ganache.
      // const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
      // const web3 = new Web3(provider);
      // provider.send = jest.fn().mockImplementation((_, callback) => {
      //   callback(null, { result: PERSONAL_SIGNATURE.slice(0, -2) });
      // });
      // const spiedSigner = new SignOnboardingAction(web3, 1);

      // await spiedSigner.sign(
      //   remoteAccountAddress,
      //   SigningMethod.Personal,
      //   { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
      // );
      // expect(provider.send).toHaveBeenCalledWith(
      //   {
      //     id: expect.any(Number),
      //     jsonrpc: '2.0',
      //     method: 'personal_sign',
      //     params: [
      //       GANACHE_ADDRESS,
      //       EXPECTED_PERSONAL_MESSAGE,
      //     ],
      //   },
      //   expect.any(Function), // Callback.
      // );
    });

    it.skip('verifies a message signed using SigningMethod.Personal', async () => {
      expect(
        localSigner.verify(
          PERSONAL_SIGNATURE,
          remoteAccountAddress,
          { action: OnboardingActionString.ONBOARDING, onlySignOn: 'https://flash1.com' },
        ),
      ).toBe(true);

      // Try again, with the message parameters in a different order.
      expect(
        localSigner.verify(
          PERSONAL_SIGNATURE,
          remoteAccountAddress,
          { onlySignOn: 'https://flash1.com', action: OnboardingActionString.ONBOARDING },
        ),
      ).toBe(true);
    });
  });
});
