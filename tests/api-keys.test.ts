/**
 * Unit tests for the API keys module.
 */

import axios, { AxiosResponse } from 'axios';
import { ethers } from 'ethers';

import { ApiKeyCredentials, Flash1Client } from '../src';
import { asMock } from './helpers/util';

const apiKeyCredentials: ApiKeyCredentials = {
  key: 'd53c3a7d-3add-68db-a9c3-9ad582313c8e',
  secret: '85BR_H-GC7HS3aydOxLw3zjRuDI6RYVgFmsYaKJh',
  passphrase: '1qYatmED3wy9RnDZsGnR',
};

describe('API Keys Module & Private Module', () => {
  it('signs a private request', async () => {
    asMock(axios).mockResolvedValue({} as AxiosResponse);

    const wallet = ethers.Wallet.createRandom(); // TODO: use ganache private key?
    const client = new Flash1Client('https://example.com', { signer: wallet, apiKeyCredentials });
    await client.private.getApiKeys();

    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith({
      url: expect.stringContaining('/api/v1/private/api-keys'),
      method: 'GET',
      headers: {
        'FLASH1-API-KEY': expect.stringMatching(/[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}/),
        'FLASH1-TIMESTAMP': expect.any(String),
        'FLASH1-PASSPHRASE': expect.stringMatching(/^[A-Za-z0-9_-]{20}$/),
        'FLASH1-SIGNATURE': expect.any(String),
      },
      data: undefined,
    });
  });

  it('signs an ApiKey request', async () => {
    asMock(axios).mockResolvedValue({} as AxiosResponse);

    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const client = new Flash1Client('https://example.com', { signer: wallet });
    await client.ethPrivate.deleteApiKey(apiKeyCredentials.key, address);

    expect(axios).toHaveBeenCalledTimes(1);
    expect(axios).toHaveBeenCalledWith({
      url: expect.stringContaining('/api/v1/private/api-keys'),
      method: 'DELETE',
      headers: {
        'FLASH1-SIGNATURE': expect.stringMatching(/0x[0-9a-f]{130}/),
        'FLASH1-TIMESTAMP': expect.any(String),
        'FLASH1-ETHEREUM-ADDRESS': expect.stringMatching(/0x[0-9a-fA-F]{40}/),
      },
    });
  });
});
