import BigNumber from 'bignumber.js';
import * as ethers from 'ethers';
import pick from 'lodash/pick';
import keys from 'lodash/keys';

import { SigningMethod, SignatureTypes, Address, Signer } from '../types';
import {
  EIP712_DOMAIN_STRING_NO_CONTRACT,
  // EIP712_DOMAIN_STRUCT_NO_CONTRACT,
  addressesAreEqual,
  createTypedSignature,
  ecRecoverTypedSignature,
  hashString,
  stripHexPrefix,
} from './helpers';

// IMPORTANT: The order of these params affects the message signed with SigningMethod.PERSONAL.
//            The message should not be changed at all since it's used to generated default keys.
const PERSONAL_SIGN_DOMAIN_PARAMS = ['name', 'version', 'chainId'];

type EIP712Struct = {
  type: string;
  name: string;
}[];

export abstract class SignOffChainAction<M extends {}> {
  protected readonly signer: Signer;
  protected readonly networkId: number;
  private readonly actionStruct: EIP712Struct;
  private readonly domain: string;
  private readonly version: string;

  constructor(
    signer: Signer,
    networkId: number,
    actionStruct: EIP712Struct,
    {
      domain = 'flash1',
      version = '1.0',
    }: {
      domain?: string;
      version?: string;
    } = {}
  ) {
    this.signer = signer;
    this.networkId = networkId;
    this.actionStruct = actionStruct;
    this.domain = domain;
    this.version = version;
  }

  public abstract getHash(message: M): string;

  /**
   * Returns a signable EIP712 Hash of a struct
   */
  public getEIP712Hash(structHash: string): string {
    const hash: string | null = ethers.utils.solidityKeccak256(
      ['bytes2', 'bytes32', 'bytes32'],
      ['0x1901', this.getDomainHash() as string, structHash]
    );
    // Non-null assertion operator is safe, hash is null only on empty input.
    return hash!;
  }

  public async sign(
    signer: string,
    signingMethod: SigningMethod,
    message: M
  ): Promise<string> {
    switch (signingMethod) {
      case SigningMethod.Hash:
      case SigningMethod.UnsafeHash:
      case SigningMethod.Compatibility: {
        const hash = this.getHash(message);
        const rawSignature = await this.signer.signMessage(
          ethers.utils.arrayify(hash)
        );

        const hashSig = createTypedSignature(
          rawSignature,
          SignatureTypes.DECIMAL
        );
        if (signingMethod === SigningMethod.Hash) {
          return hashSig;
        }

        const unsafeHashSig = createTypedSignature(
          rawSignature,
          SignatureTypes.NO_PREPEND
        );
        if (signingMethod === SigningMethod.UnsafeHash) {
          return unsafeHashSig;
        }

        if (this.verify(unsafeHashSig, signer, message)) {
          return unsafeHashSig;
        }
        return hashSig;
      }

      case SigningMethod.MetaMask:
      case SigningMethod.MetaMaskLatest:
      case SigningMethod.CoinbaseWallet:
      case SigningMethod.TypedData: {
        const rawSignature = await (
          this.signer as ethers.Wallet
        )._signTypedData(
          this.getDomainData(),
          { [this.domain]: this.actionStruct },
          message
        );
        return createTypedSignature(rawSignature, SignatureTypes.NO_PREPEND);
      }

      case SigningMethod.Personal: {
        const messageString = this.getPersonalSignMessage(message);
        return this.ethSignPersonalInternal(signer, messageString);
      }

      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }
  }

  public verify(
    typedSignature: string,
    expectedSigner: Address,
    message: M
  ): boolean {
    if (stripHexPrefix(typedSignature).length !== 66 * 2) {
      throw new Error(
        `Unable to verify signature with invalid length: ${typedSignature}`
      );
    }

    const sigType = parseInt(typedSignature.slice(-2), 16);
    let hashOrMessage: string;
    switch (sigType) {
      case SignatureTypes.NO_PREPEND:
      case SignatureTypes.DECIMAL:
      case SignatureTypes.HEXADECIMAL:
        hashOrMessage = this.getHash(message);
        break;
      case SignatureTypes.PERSONAL:
        hashOrMessage = this.getPersonalSignMessage(message);
        break;
      default:
        throw new Error(`Invalid signature type: ${sigType}`);
    }

    const signer = ecRecoverTypedSignature(hashOrMessage, typedSignature);
    return addressesAreEqual(signer, expectedSigner);
  }

  /**
   * Get the message string to be signed when using SignatureTypes.PERSONAL.
   *
   * This signing method may be used in cases where EIP-712 signing is not possible.
   */
  public getPersonalSignMessage(message: M): string {
    // Make sure the output is deterministic for a given input.
    return JSON.stringify(
      {
        ...pick(this.getDomainData(), PERSONAL_SIGN_DOMAIN_PARAMS),
        ...pick(message, keys(message).sort()),
      },
      null,
      2
    );
  }

  public getDomainHash(): string {
    const hash: string | null = ethers.utils.solidityKeccak256(
      ['bytes32', 'bytes32', 'bytes32', 'uint256'],
      [
        hashString(EIP712_DOMAIN_STRING_NO_CONTRACT),
        hashString(this.domain),
        hashString(this.version),
        new BigNumber(this.networkId).toFixed(0),
      ]
    );
    // Non-null assertion operator is safe, hash is null only on empty input.
    return hash!;
  }

  /**
   * Sign a message with `personal_sign`.
   */
  protected async ethSignPersonalInternal(
    signer: string,
    message: string
  ): Promise<string> {
    const dataHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(message));
    const dataHashBin = ethers.utils.arrayify(dataHash);
    const signature = await this.signer.signMessage(dataHashBin);
    return createTypedSignature(signature, SignatureTypes.PERSONAL); // TODO: do we need this?
  }

  private getDomainData() {
    return {
      name: this.domain,
      version: this.version,
      chainId: this.networkId,
    };
  }
}
