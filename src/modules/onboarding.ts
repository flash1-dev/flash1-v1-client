import {
  KeyPairWithYCoordinate,
  keyPairFromData,
} from '@flash1-exchange/starkex-lib';

import { SignOnboardingAction } from '../eth-signing';
import {
  stripHexPrefix,
  generateStarkKeyPairsFromPrivate,
} from '../eth-signing/helpers';
import {
  keccak256Buffer,
  toBase64Url,
  uuidFormatKey,
} from '../helpers/request-helpers';
import { RequestMethod, axiosRequest } from '../lib/axios';
import {
  AccountResponseObject,
  ApiKeyCredentials,
  Data,
  ISO31661ALPHA2,
  OnboardingAction,
  OnboardingActionString,
  SigningMethod,
  UserResponseObject,
  Signer,
} from '../types';

/*
  Handles wallet registration -> for decentralized backend
*/

const KEY_DERIVATION_SUPPORTED_SIGNING_METHODS: SigningMethod[] = [
  SigningMethod.TypedData,
  SigningMethod.MetaMask,
  SigningMethod.MetaMaskLatest,
  SigningMethod.CoinbaseWallet,
  SigningMethod.Personal,
];

export default class Onboarding {
  readonly host: string;
  readonly networkId: number;
  readonly onBoardingSigner: SignOnboardingAction;

  constructor(host: string, signer: Signer, networkId: number) {
    this.host = host;
    this.networkId = networkId;
    this.onBoardingSigner = new SignOnboardingAction(signer, networkId);
  }

  // ============ Request Helpers ============

  protected async post(
    endpoint: string,
    data: {},
    ethereumAddress: string,
    signature: string | null = null,
    signingMethod: SigningMethod = SigningMethod.TypedData
  ): Promise<Data> {
    const message: OnboardingAction = {
      action: OnboardingActionString.ONBOARDING,
    };

    // On mainnet, include an extra onlySignOn parameter.
    if (this.networkId === 1) {
      message.onlySignOn = 'https://flash1.com';
    }

    const url = `/api/v1/public/${endpoint}`;
    return axiosRequest({
      url: `${this.host}${url}`,
      method: RequestMethod.POST,
      data,
      headers: {
        'FLASH1-SIGNATURE':
          signature ||
          (await this.onBoardingSigner.sign(
            ethereumAddress,
            signingMethod,
            message
          )),
        'FLASH1-ETHEREUM-ADDRESS': ethereumAddress,
      },
    });
  }

  // ============ Requests ============

  /**
   * @description create a user, account and apiKey in one onboarding request
   *
   * @param {
   * @starkKey is the unique public key for starkwareLib operations used in the future
   * @starkKeyYCoordinate is the Y Coordinate of the unique public key for starkwareLib
   * operations used in the future
   * }
   * @param ethereumAddress of the account
   * @param signature validating the request
   * @param signingMethod for the request
   * @param referredByAffiliateLink of affiliate who referred the user
   * @param country for the user (ISO 3166-1 Alpha-2 Compliant)
   */
  async createUser(
    params: {
      starkKey: string;
      starkKeyYCoordinate: string;
      referredByAffiliateLink?: string;
      country?: ISO31661ALPHA2;
    },
    ethereumAddress: string,
    signature: string | null = null,
    signingMethod?: SigningMethod
  ): Promise<{
    apiKey: ApiKeyCredentials;
    user: UserResponseObject;
    account: AccountResponseObject;
  }> {
    return this.post(
      'onboarding',
      params,
      ethereumAddress,
      signature,
      signingMethod
    );
  }

  // ============ Key Derivation ============

  /**
   * @description Derive a STARK key pair deterministically from an Ethereum key.
   *
   * This is used by the frontend app to derive the STARK key pair in a way that is recoverable.
   * Programmatic traders may optionally derive their STARK key pair in the same way.
   *
   * @param ethereumAddress Ethereum address of the account to use for signing.
   * @param signingMethod Method to use for signing.
   */
  async deriveStarkKey(
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.TypedData
  ): Promise<KeyPairWithYCoordinate> {
    if (!KEY_DERIVATION_SUPPORTED_SIGNING_METHODS.includes(signingMethod)) {
      throw new Error('Unsupported signing method for API key derivation');
    }

    const message: OnboardingAction = {
      action: OnboardingActionString.KEY_DERIVATION,
    };

    // On mainnet, include an extra onlySignOn parameter.
    if (this.networkId === 1) {
      message.onlySignOn = 'https://flash1.com';
    }

    const signature = await this.onBoardingSigner.sign(
      ethereumAddress,
      signingMethod,
      message
    );
    return generateStarkKeyPairsFromPrivate(
      keyPairFromData(Buffer.from(stripHexPrefix(signature), 'hex'))
    );
  }

  /**
   * @description Derive an API key pair deterministically from an Ethereum key.
   *
   * This is used by the frontend app to recover the default API key credentials.
   *
   * @param ethereumAddress Ethereum address of the account to use for signing.
   * @param signingMethod Method to use for signing.
   */
  async recoverDefaultApiCredentials(
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.TypedData
  ): Promise<ApiKeyCredentials> {
    if (!KEY_DERIVATION_SUPPORTED_SIGNING_METHODS.includes(signingMethod)) {
      throw new Error('Unsupported signing method for API key derivation');
    }

    const message: OnboardingAction = {
      action: OnboardingActionString.ONBOARDING,
    };

    // On mainnet, include an extra onlySignOn parameter.
    if (this.networkId === 1) {
      message.onlySignOn = 'https://flash1.com';
    }

    const signature = await this.onBoardingSigner.sign(
      ethereumAddress,
      signingMethod,
      message
    );
    const buffer = Buffer.from(stripHexPrefix(signature), 'hex');

    // Get secret.
    const rBuffer = buffer.slice(0, 32);
    const rHashedData = keccak256Buffer(rBuffer);
    const secret = rHashedData.slice(0, 30);

    // Get key and passphrase.
    const sBuffer = buffer.slice(32, 64);
    const sHashedData = keccak256Buffer(sBuffer);
    const key = sHashedData.slice(0, 16);
    const passphrase = sHashedData.slice(16, 31);

    return {
      secret: toBase64Url(secret),
      key: uuidFormatKey(key),
      passphrase: toBase64Url(passphrase),
    };
  }
}
