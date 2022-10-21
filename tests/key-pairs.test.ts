/**
 * Unit tests stark key pairs
 */

import { ethers } from 'ethers';

import { ApiKeyCredentials, Flash1Client } from '../src';
import { RequestMethod } from '../src/lib/axios';

const apiKeyCredentials: ApiKeyCredentials = {
  key: 'foo',
  secret: 'qnjyWWTHMY5SFqmNpJga_fXL-3lwOqUIpmz2izlV',
  passphrase: 'foo',
};

describe('stark key pairs', () => {
  it('derives', async () => {
    const ethAddress = '0x967D614157424D2375DFc7A209df5Cc9fA81e2Fd';
    const wallet = new ethers.Wallet(
      'bce4425a9782e4c067d52ee36b51901fa612433e11594ed7b4180551f313a0ca'
    );
    expect(wallet.address).toEqual(ethAddress);
    const client = new Flash1Client('https://example.com', {
      networkId: 5,
      signer: wallet,
      apiKeyCredentials,
    });
    const starkKeys = await client.onboarding.deriveStarkKey(ethAddress);
    expect(starkKeys.publicKey).toEqual(
      '0x00c3c9df6ee7df6cdf69042b8b3487ff67dc8a47b0c28021c217b7ad8b189765'
    );
  });

  it('correct serialization on client initialization', async () => {
    const wallet = ethers.Wallet.createRandom();

    let client = new Flash1Client('https://example.com', {
      networkId: 5,
      signer: wallet,
      apiKeyCredentials,
      starkPrivateKey:
        '05c76754a1087c1f89ab1a7ed3540244959e08fbb2b0e5dd6e00d90a42b642d4',
    });
    expect(client.starkPrivateKey.publicKey).toEqual(
      '0x02d71a80ccf5b0add0325ac066ae47966b633cddb510987c420cebce6a8eee01'
    );

    client = new Flash1Client('https://example.com', {
      networkId: 5,
      signer: wallet,
      apiKeyCredentials,
      starkPrivateKey:
        '0x05c76754a1087c1f89ab1a7ed3540244959e08fbb2b0e5dd6e00d90a42b642d4',
    });
    expect(client.starkPrivateKey.publicKey).toEqual(
      '0x02d71a80ccf5b0add0325ac066ae47966b633cddb510987c420cebce6a8eee01'
    );

    client = new Flash1Client('https://example.com', {
      networkId: 5,
      signer: wallet,
      apiKeyCredentials,
      starkPrivateKey:
        '0324f4021870c102e7c7b67bcf33eed6e3796129a424a358bba542776848ade4',
    });
    expect(client.starkPrivateKey.publicKey).toEqual(
      '0x00c3c9df6ee7df6cdf69042b8b3487ff67dc8a47b0c28021c217b7ad8b189765'
    );
  });
});
