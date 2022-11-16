// yarn ts-node starkex-test-plan/trade.ts
import { getClient, userA, userB, NETWORK_ID } from './common';
import {
  SignableOrder,
  StarkwareOrderType,
  Flash1Market,
  StarkwareOrderSide,
} from '@flash1-exchange/starkex-lib';
import { getDefaultVaultId } from '../src/helpers/request-helpers';
import { randomBytes } from 'ethers/lib/utils';
import { ApiOrder, OrderType, PartialBy, TimeInForce } from '../src/types';
import { apiOrderToStarkexOrder } from '../src/helpers/order-helpers';

/**
User A gives an order of selling 1000USDC for 0.05BTC, paying 4 USDC as fee.
User B gives an order of selling 0.05BTC for 1000USDC, paying 6 USDC as fee.
The orders are matched as a trade
 */

(async () => {
  const orderA = {
    quantity: '0.05',
    price: `${1000 / 0.05}`,
    limitFee: '4',
    instrument: Flash1Market.BTC_USD,
    side: StarkwareOrderSide.BUY,
    timeInForce: TimeInForce.GTC,
    hidden: false,
    postOnly: false,
    leverage: 0,
    userCollateral: 1000,
    expiration: `${new Date().toISOString()}`,
    type: OrderType.LIMIT,
    clientId: randomBytes(10).toString(),
    signature: '',
  };
  const sigA = await SignableOrder.fromOrder(
    apiOrderToStarkexOrder(orderA, getDefaultVaultId(userA.starkex.publicKey)),
    NETWORK_ID
  ).sign(userA.starkex.privateKey);

  const orderB = {
    quantity: '0.05',
    price: `${1000 / 0.05}`,
    limitFee: '6',
    instrument: Flash1Market.BTC_USD,
    side: StarkwareOrderSide.SELL,
    timeInForce: TimeInForce.GTC,
    hidden: false,
    postOnly: false,
    leverage: 0,
    userCollateral: 1000,
    expiration: `${new Date().toISOString()}`,
    type: OrderType.LIMIT,
    clientId: randomBytes(10).toString(),
    signature: '',
  };
  const sigB = await SignableOrder.fromOrder(
    apiOrderToStarkexOrder(orderB, getDefaultVaultId(userB.starkex.publicKey)),
    NETWORK_ID
  ).sign(userB.starkex.privateKey);

  orderA.signature = sigA;
  orderB.signature = sigB;

  const client = await getClient(userA);
  const resp = await client.private.starkexTestPlan({
    ordersToMatch: [orderA, orderB],
    starkKeys: [userA.starkex.publicKey, userB.starkex.publicKey],
    fees: [4, 6],
  });
})();
