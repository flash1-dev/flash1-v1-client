// yarn ts-node starkex-test-plan/trade.ts
import { getClient, userA, userB } from './common';
import {
  SignableOrder,
  StarkwareOrderType,
} from '@flash1-exchange/starkex-lib';

(async () => {
  const orderA = await new SignableOrder(
    {
      orderType: StarkwareOrderType.LIMIT_ORDER_WITH_FEES,
      quantumsAmountFee: '1',
      assetIdFee: '1',
      positionId: '',
      nonce: '',
      expirationEpochHours: 1,
      quantumsAmountSynthetic: '',
      quantumsAmountCollateral: '',
      assetIdSynthetic: '',
      assetIdCollateral: '',
      isBuyingSynthetic: false,
    },
    5
  ).sign(userA.starkex.privateKey);

  const orderB = await new SignableOrder(
    {
      orderType: StarkwareOrderType.LIMIT_ORDER_WITH_FEES,
      quantumsAmountFee: '1',
      assetIdFee: '1',
      positionId: '',
      nonce: '',
      expirationEpochHours: 1,
      quantumsAmountSynthetic: '',
      quantumsAmountCollateral: '',
      assetIdSynthetic: '',
      assetIdCollateral: '',
      isBuyingSynthetic: false,
    },
    5
  ).sign(userB.starkex.privateKey);

  const client = await getClient(userA);
  const resp = await client.private.starkexTestPlan();
})();
