import { ethers } from 'ethers';

import { stripHexPrefix } from '../eth-signing/helpers';

export function generateQueryPath(url: string, params: {}): string {
  const definedEntries = Object.entries(params)
    .filter(([_key, value]: [string, unknown]) => value !== undefined);

  if (!definedEntries.length) {
    return url;
  }

  const paramsString = definedEntries.map(
    ([key, value]: [string, unknown]) => `${key}=${value}`,
  ).join('&');
  return `${url}?${paramsString}`;
}

export function keccak256Buffer(input: Buffer): Buffer {
  if (input.length === 0) {
    throw new Error('keccak256Buffer: Expected a Buffer with non-zero length');
  }
  return Buffer.from(stripHexPrefix(ethers.utils.keccak256(input as unknown as string)!), 'hex');
}

export function generateRandomClientId() {
  return Math.random().toString().slice(2).replace(/^0+/, '');
}
