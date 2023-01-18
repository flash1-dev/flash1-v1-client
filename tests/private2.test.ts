/**
 * Unit tests signing with credentials.
 */

import axios, { AxiosResponse } from 'axios';
import { ethers } from 'ethers';

import { ApiKeyCredentials, Flash1Client } from '../src';
import { RequestMethod } from '../src/lib/axios';
import { asMock } from './helpers/util';

const apiKeyCredentials: ApiKeyCredentials = {
  key: '0x03a70594153f39be6eae5bd0c86831d7c10372893c4672918fa45bbaba63452224',
  secret: '0x52e0d6eb03da1b78b9dc005041264edc021decad56f99c9bdcc262f4a05ebcdb',
  passphrase: '1qYatmED3wy9RnDZsGnR',
};

describe('Verify signature is as expected', () => {
  it('signs a private request', async () => {
    asMock(axios).mockResolvedValue({} as AxiosResponse);

    const wallet = ethers.Wallet.createRandom();

    const client = new Flash1Client('https://example.com', {
      signer: wallet,
      apiKeyCredentials,
    });
    const signature = await client.private.signECDSA({
      requestPath:
        '/v1/api-keys?ethereumAddress=0xE5714924C8C5c732F92A439075C8211eB0611aaC',
      method: RequestMethod.GET,
      isoTimestamp: '2021-02-01T19:38:54.508Z',
    });
    expect(signature).toEqual(
      '3045022100d84d7767946d11b21ab3d48220bb69ff53719122d12d5166fb87d830606e34490220133f3b2bd61683be4910ac3849b8b497aa36e37fe99c74229025cd5e17a34d0f'
    );
  });
});
