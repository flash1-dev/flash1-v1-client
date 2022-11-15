import { ethers } from 'ethers';
import cryptoJS from 'crypto-js';
import BN from 'bn.js';

import { stripHexPrefix } from '../eth-signing/helpers';

const MAX_VAULT_ID = new BN(2).pow(new BN(64));

export function generateQueryPath(url: string, params: {}): string {
  const definedEntries = Object.entries(params).filter(
    ([_key, value]: [string, unknown]) => value !== undefined
  );

  if (!definedEntries.length) {
    return url;
  }

  const paramsString = definedEntries
    .map(([key, value]: [string, unknown]) => `${key}=${value}`)
    .join('&');
  return `${url}?${paramsString}`;
}

export function keccak256Buffer(input: Buffer): Buffer {
  if (input.length === 0) {
    throw new Error('keccak256Buffer: Expected a Buffer with non-zero length');
  }
  return Buffer.from(
    stripHexPrefix(ethers.utils.keccak256(input as unknown as string)!),
    'hex'
  );
}

export function generateRandomClientId() {
  return Math.random().toString().slice(2).replace(/^0+/, '');
}

export function getDefaultVaultId(starkPublicKey: string) {
  const hash = cryptoJS.algo.SHA256.create();
  const vaultIdHex = hash
    .update(
      cryptoJS.enc.Hex.parse(stripHexPrefix(starkPublicKey.toLowerCase()))
    )
    .finalize()
    .toString(cryptoJS.enc.Hex);
  return hexToBn(vaultIdHex).mod(MAX_VAULT_ID).toString();
}

/**
 * Convert a hex string with optional 0x prefix to a BN.
 */
export function hexToBn(hex: string): BN {
  return new BN(stripHexPrefix(hex), 16);
}

/**
 * Prefixes `0x` in case that prefix doesn't exist
 */
export function addHexPrefix(hex: string): string {
  if (!hex.startsWith('0x')) {
    return `0x${hex}`;
  }
  return hex;
}
