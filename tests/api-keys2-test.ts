/**
 * Unit tests for the API keys module.
 */

import axios, { AxiosResponse } from 'axios';
import { ethers } from 'ethers';

import { ApiKeyCredentials, Flash1Client } from '../src';
import { asMock } from './helpers/util';

const apiKeyCredentials: ApiKeyCredentials = {
  key: '0x03a70594153f39be6eae5bd0c86831d7c10372893c4672918fa45bbaba63452224',
  secret: '0x52e0d6eb03da1b78b9dc005041264edc021decad56f99c9bdcc262f4a05ebcdb',
  passphrase: '1qYatmED3wy9RnDZsGnR',
};

describe('API Keys Module & Private Module', () => {
  it('signs a private request', async () => {
    asMock(axios).mockResolvedValue({} as AxiosResponse);

    const wallet = ethers.Wallet.createRandom(); // TODO: use ganache private key?
    const client = new Flash1Client('https://example.com', {
      signer: wallet,
      apiKeyCredentials,
    });
    await client.private.getApiKeys();

    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith({
      url: expect.stringContaining('/api/v1/private/api-keys'),
      method: 'GET',
      headers: {
        'FLASH1-API-KEY': apiKeyCredentials.key,
        'FLASH1-TIMESTAMP': expect.any(String),
        'FLASH1-PASSPHRASE': expect.stringMatching(/^[A-Za-z0-9_-]{20}$/),
        'FLASH1-SIGNATURE': expect.any(String),
      },
      data: undefined,
    });
  });
});
