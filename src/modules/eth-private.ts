import { ApiMethod } from '@dydxprotocol/starkex-lib';
import _ from 'lodash';

import { SignEthPrivateAction } from '../eth-signing';
import { generateQueryPath } from '../helpers/request-helpers';
import {
  axiosRequest,
} from '../lib/axios';
import {
  ApiKeyCredentials,
  Data,
  ISO8601,
  PositionResponseObject,
  SigningMethod,
  Signer,
} from '../types';
import Clock from './clock';

export default class EthPrivate {
  readonly host: string;
  readonly actionSigner: SignEthPrivateAction;
  readonly clock: Clock;

  constructor({
    host,
    signer,
    networkId,
    clock,
  }: {
    host: string,
    signer: Signer,
    networkId: number,
    clock: Clock,
  }) {
    this.host = host;
    this.actionSigner = new SignEthPrivateAction(signer, networkId);
    this.clock = clock;
  }

  // ============ Request Helpers ============

  protected async request(
    method: ApiMethod,
    endpoint: string,
    ethereumAddress: string,
    signingMethod: SigningMethod,
    data: {} = {},
  ): Promise<Data> {
    const requestPath: string = `/v1/${endpoint}`;
    const timestamp: ISO8601 = this.clock.getAdjustedIsoString();
    const body: string = JSON.stringify(data);
    const signature: string = await this.actionSigner.sign(
      ethereumAddress,
      signingMethod,
      {
        method,
        requestPath,
        body,
        timestamp,
      },
    );
    return axiosRequest({
      url: `${this.host}${requestPath}`,
      method,
      data: !_.isEmpty(data) ? body : undefined,
      headers: {
        'FLASH1-SIGNATURE': signature,
        'FLASH1-TIMESTAMP': timestamp,
        'FLASH1-ETHEREUM-ADDRESS': ethereumAddress,
      },
    });
  }

  protected async post(
    endpoint: string,
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.Hash,
  ): Promise<Data> {
    return this.request(ApiMethod.POST, endpoint, ethereumAddress, signingMethod);
  }

  protected async delete(
    endpoint: string,
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.Hash,
    params: {},
  ): Promise<Data> {
    const requestPath = generateQueryPath(endpoint, params);
    return this.request(ApiMethod.DELETE, requestPath, ethereumAddress, signingMethod);
  }

  protected async get(
    endpoint: string,
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.Hash,
  ): Promise<Data> {
    return this.request(ApiMethod.GET, endpoint, ethereumAddress, signingMethod);
  }

  // ============ Requests ============

  /**
   * @description have an auto-generated apikey, secret and passphrase generated
   * for an ethereumAddress.
   * @param ethereumAddress the apiKey will be for
   * @param signingMethod used to validate the request
   */
  async createApiKey(
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.Hash,
  ): Promise<{ apiKey: ApiKeyCredentials }> {
    return this.post('api-keys', ethereumAddress, signingMethod);
  }

  /**
   *
   * @param apiKey to be deleted
   * @param ethereumAddress the apiKey is for
   * @param signingMethod used to validate the request
   */
  async deleteApiKey(
    apiKey: string,
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.Hash,
  ): Promise<void> {
    return this.delete('api-keys', ethereumAddress, signingMethod, { apiKey });
  }

  /**
   * @description This is for if you can't recover your starkKey or apiKey and need an
   * additional way to get your starkKey, positionid and balance on our exchange,
   *  all of which are needed to call the L1 solidity function needed to recover your funds.
   *
   * @param ethereumAddress the recovery is for
   * @param signingMethod used to validate the request
   */
  async recovery(
    ethereumAddress: string,
    signingMethod: SigningMethod = SigningMethod.Hash,
  ): Promise<{
    starkKey: string,
    positionId: string,
    equity: string,
    freeCollateral: string,
    quoteBalance: string,
    positions: PositionResponseObject[],
  }> {
    return this.get('recovery', ethereumAddress, signingMethod);
  }
}
