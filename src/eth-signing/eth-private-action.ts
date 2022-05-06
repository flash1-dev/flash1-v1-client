import { ethers } from 'ethers';

import { EthPrivateAction, Signer } from '../types';
import { hashString } from './helpers';
import { SignOffChainAction } from './sign-off-chain-action';

const EIP712_ETH_PRIVATE_ACTION_STRUCT = [
  { type: 'string', name: 'method' },
  { type: 'string', name: 'requestPath' },
  { type: 'string', name: 'body' },
  { type: 'string', name: 'timestamp' },
];
const EIP712_ETH_PRIVATE_ACTION_STRUCT_STRING = (
  'flash1(' +
  'string method,' +
  'string requestPath,' +
  'string body,' +
  'string timestamp' +
  ')'
);

export class SignEthPrivateAction extends SignOffChainAction<EthPrivateAction> {

  constructor(
    signer: Signer,
    networkId: number,
  ) {
    super(signer, networkId, EIP712_ETH_PRIVATE_ACTION_STRUCT);
  }

  public getHash(
    message: EthPrivateAction,
  ): string {
    const structHash: string | null = ethers.utils.solidityKeccak256(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [hashString(EIP712_ETH_PRIVATE_ACTION_STRUCT_STRING),
        hashString(message.method), hashString(message.requestPath),
        hashString(message.body), hashString(message.timestamp)],
    );
    // Non-null assertion operator is safe, hash is null only on empty input.
    return this.getEIP712Hash(structHash!);
  }
}
