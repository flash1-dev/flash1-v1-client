import { asEcKeyPair, asSimpleKeyPair } from '@flash1-exchange/starkex-lib';
import { Flash1 as Flash1Eth, Config } from '@flash1-exchange/starkex-eth';
import Clock from './modules/clock';
import EthPrivate from './modules/eth-private';
import Onboarding from './modules/onboarding';
import Private from './modules/private';
import Public from './modules/public';
import { ApiKeyCredentials, Signer, KeyPair } from './types';
import { addHexPrefix } from './helpers/request-helpers';

export interface ClientOptions {
  apiTimeout?: number;
  networkId?: number;
  starkPrivateKey?: string | KeyPair;
  signer?: Signer;
  ethAddress?: string;
  apiKeyCredentials?: ApiKeyCredentials;
  timestampAdjustment?: number;
  flashloanAccount?: string;
  insuranceAccount?: string;
}

export class Flash1Client {
  readonly host: string;
  readonly apiTimeout?: number;
  readonly ethAddress?: string;
  readonly networkId: number;
  readonly signer?: Signer;
  readonly flashloanAccount?: string;
  readonly insuranceAccount?: string;
  apiKeyCredentials?: ApiKeyCredentials;
  starkPrivateKey?: string | KeyPair;

  // Modules.
  private readonly _public: Public;
  private readonly _clock: Clock;

  // Modules. These are created on-demand.
  private _private?: Private;
  private _ethPrivate?: EthPrivate;
  private _onboarding?: Onboarding;
  private _eth?: Flash1Eth;

  constructor(host: string, options: ClientOptions = {}) {
    this.host = host;
    this.apiTimeout = options.apiTimeout;
    this.networkId =
      typeof options.networkId === 'number' ? options.networkId : 1;
    this.starkPrivateKey = options.starkPrivateKey;
    this.apiKeyCredentials = options.apiKeyCredentials;
    this.signer = options.signer;
    this.ethAddress = options.ethAddress;
    this.flashloanAccount = options.flashloanAccount;
    this.insuranceAccount = options.insuranceAccount;

    // Modules.
    this._public = new Public(host);
    this._clock = new Clock(options.timestampAdjustment);
  }

  /**
   * Get the public module, used for interacting with public endpoints.
   */
  get public(): Public {
    return this._public;
  }

  /**
   * Get the clock module, used for adjusting system time to server time.
   */
  get clock(): Clock {
    return this._clock;
  }

  /**
   * Get the private module, used for interacting with endpoints that require API-key auth.
   */
  get private(): Private {
    if (!this._private) {
      if (this.apiKeyCredentials) {
        this._private = new Private({
          host: this.host,
          apiKeyCredentials: this.apiKeyCredentials,
          starkPrivateKey: this.starkPrivateKey,
          networkId: this.networkId,
          clock: this._clock,
          flashloanAccount: this.flashloanAccount,
          insuranceAccount: this.insuranceAccount,
        });
      } else {
        return notSupported(
          'Private endpoints are not supported since apiKeyCredentials was not provided'
        ) as Private;
      }
    }
    return this._private;
  }

  /**
   * Get the keys module, used for managing API keys. Requires Ethereum key auth.
   */
  get ethPrivate(): EthPrivate {
    if (!this._ethPrivate) {
      if (this.signer) {
        this._ethPrivate = new EthPrivate({
          host: this.host,
          signer: this.signer!,
          networkId: this.networkId,
          clock: this._clock,
        });
      } else {
        return notSupported(
          'Eth private endpoints are not supported since neither web3 nor web3Provider was provided'
        ) as EthPrivate;
      }
    }
    return this._ethPrivate;
  }

  /**
   * Get the onboarding module, used to create a new user. Requires Ethereum key auth.
   */
  get onboarding(): Onboarding {
    if (!this._onboarding) {
      if (this.signer) {
        this._onboarding = new Onboarding(
          this.host,
          this.signer,
          this.networkId
        );
      } else {
        return notSupported(
          'Onboarding endpoints are not supported since neither web3 nor web3Provider was provided'
        ) as Onboarding;
      }
    }
    return this._onboarding;
  }

  /**
   * Get the eth module, used for interacting with Ethereum smart contracts.
   */
  get eth() {
    if (!this._eth) {
      if (this.signer && this.starkPrivateKey && this.ethAddress) {
        const starkPrivateKey =
          typeof this.starkPrivateKey == 'string'
            ? this.starkPrivateKey
            : this.starkPrivateKey.privateKey;
        const starkKeypair = asSimpleKeyPair(asEcKeyPair(starkPrivateKey));
        this._eth = new Flash1Eth(
          this.networkId == 1 ? Config.MAINNET : Config.GOERLI,
          {
            starkex: {
              publicKey: addHexPrefix(starkKeypair.publicKey),
              privateKey: addHexPrefix(starkPrivateKey.toString()),
            },
            ethereum: {
              publicKey: this.ethAddress,
              privateKey: '',
            },
          }
        );
      } else {
        return notSupported(
          `Eth endpoints are not supported since neither signer nor starkPrivateKey were provided`
        ) as Flash1Eth;
      }
    }
    return this._eth;
  }

  setStarkPrivateKey(privateOrKeyPair: string | KeyPair) {
    this.starkPrivateKey = privateOrKeyPair;
  }
}

/**
 * Returns a proxy object that throws with the given message when trying to call a function on it.
 */
function notSupported(errorMessage: string): {} {
  const handler = {
    get() {
      throw new Error(errorMessage);
    },
  };
  return new Proxy({}, handler);
}
