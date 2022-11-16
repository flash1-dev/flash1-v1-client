import { OrderWithClientId } from '@flash1-exchange/starkex-lib';
import { ApiOrder, PartialBy, ApiOrderWithFlashloan } from 'src/types';

export const apiOrderToStarkexOrder = (
  params:
    | ApiOrder
    | PartialBy<ApiOrder, 'signature' | 'clientId'>
    | PartialBy<
        ApiOrderWithFlashloan,
        | 'signature'
        | 'flashloanSignature'
        | 'insuranceSignature'
        | 'closingOrderSignature'
        | 'clientId'
      >,
  positionId: string,
  clientId?: string
): OrderWithClientId => {
  const orderToSign: OrderWithClientId = {
    humanSize: params.quantity,
    humanPrice: params.price,
    limitFee: params.limitFee,
    market: params.instrument,
    side: params.side,
    expirationIsoTimestamp: params.expiration,
    positionId: positionId,
    clientId: params.clientId ?? clientId,
  };
  return orderToSign;
};
