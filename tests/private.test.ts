/**
 * Unit tests signing with credentials.
 */

import axios, { AxiosResponse } from 'axios';
import { ethers } from 'ethers';

import { ApiKeyCredentials, Flash1Client } from '../src';
import { RequestMethod } from '../src/lib/axios';
import { asMock } from './helpers/util';

const apiKeyCredentials: ApiKeyCredentials = {
  key: 'foo',
  secret: 'qnjyWWTHMY5SFqmNpJga_fXL-3lwOqUIpmz2izlV',
  passphrase: 'foo',
};

describe('Verify signature is as expected', () => {
  it('signs a private request', async () => {
    asMock(axios).mockResolvedValue({} as AxiosResponse);

    const wallet = ethers.Wallet.createRandom();

    const client = new Flash1Client('https://example.com', { signer: wallet, apiKeyCredentials });
    await client.private.getApiKeys();
    expect(client.private.sign({
      requestPath: '/v1/api-keys?ethereumAddress=0xE5714924C8C5c732F92A439075C8211eB0611aaC',
      method: RequestMethod.GET,
      isoTimestamp: '2021-02-01T19:38:54.508Z',
    })).toEqual('3H/uHAJiEdvIufXGwq2erXlTL82RjYzx68PxmBbT8lk=');
  });
});
