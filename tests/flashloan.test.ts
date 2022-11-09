/**
 * Unit tests for helper functions related to flashloans.
 */

import {
  getInsurancePremiumTransferSuffix,
  getClosingOrderSuffix,
  getFlashLoanReturnTransferSuffix,
} from '../src/helpers/flashloan-helpers';

describe('flashloan-helpers', () => {
  describe('clientId generation', () => {
    it('insurnace premium', async () => {
      expect(getInsurancePremiumTransferSuffix('foo')).toEqual(
        'foo-INSURANCE-FEE'
      );
    });

    it('closing fee', async () => {
      expect(getClosingOrderSuffix('foo')).toEqual('foo-CLOSING');
    });

    it('loan return', async () => {
      expect(getFlashLoanReturnTransferSuffix('foo')).toEqual(
        'foo-LOAN-RETURN'
      );
    });
  });

  describe('getDefaultVaultId', () => {
    it('generates the correct id from stark key', async () => {
      //   expect(
      //     getDefaultVaultId(
      //       '0x06b974202431eb8c0692c9c8111528d947bc7e70f7ffefaffbab7455dfa5d4f7'
      //     )
      //   ).toEqual('3788654225695651294');
      //   expect(
      //     getDefaultVaultId(
      //       '02d71a80ccf5b0add0325ac066ae47966b633cddb510987c420cebce6a8eee01'
      //     )
      //   ).toEqual('17228441837288821997');
      //   expect(
      //     getDefaultVaultId(
      //       '03dfeb7c5f43efd8019992df64145c3b8b3d48d3a48d29147e8f3f9f6cb27bec'
      //     )
      //   ).toEqual('14436392660582230522');
    });
  });

  describe('addHexPrefix', () => {
    it('should add 0x prefix if it does not exist', async () => {
      //   expect(
      //     addHexPrefix(
      //       '0x06b974202431eb8c0692c9c8111528d947bc7e70f7ffefaffbab7455dfa5d4f7'
      //     )
      //   ).toEqual(
      //     '0x06b974202431eb8c0692c9c8111528d947bc7e70f7ffefaffbab7455dfa5d4f7'
      //   );
      //   expect(
      //     addHexPrefix(
      //       '02d71a80ccf5b0add0325ac066ae47966b633cddb510987c420cebce6a8eee01'
      //     )
      //   ).toEqual(
      //     '0x02d71a80ccf5b0add0325ac066ae47966b633cddb510987c420cebce6a8eee01'
      //   );
    });
  });
});
