/**
 * Unit tests for helper and utility functions in src.
 */

import { getDefaultVaultId, generateQueryPath } from '../src/helpers/request-helpers';

describe('request-helpers', () => {

  describe('generateQueryPath', () => {
    it('creates query path', async () => {
      expect(generateQueryPath('url', {
        param1: 'value1',
        param2: undefined,
        param3: 3,
      })).toEqual('url?param1=value1&param3=3');
    });

    it('creates empty query path', async () => {
      expect(generateQueryPath('url', { param1: undefined })).toEqual('url');
      expect(generateQueryPath('url', {})).toEqual('url');
    });
  });

  describe('getDefaultVaultId', () => {
    it('generates the correct id from stark key', async () => {
      expect(getDefaultVaultId('0x06b974202431eb8c0692c9c8111528d947bc7e70f7ffefaffbab7455dfa5d4f7')).toEqual('3788654225695651294');
      expect(getDefaultVaultId('02d71a80ccf5b0add0325ac066ae47966b633cddb510987c420cebce6a8eee01')).toEqual('17228441837288821997');
      expect(getDefaultVaultId('03dfeb7c5f43efd8019992df64145c3b8b3d48d3a48d29147e8f3f9f6cb27bec')).toEqual('14436392660582230522');
    });
  });
});
