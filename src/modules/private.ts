import {
  ApiMethod,
  KeyPair,
  OrderWithClientId,
  SignableOrder,
  SignableWithdrawal,
  SignableTransfer,
  SignableRegistration,
  TransferParams,
  StarkwareOrderSide,
  SYNTHETIC_ASSET_MAP,
} from '@flash1-exchange/starkex-lib';
import crypto from 'crypto-js';
import isEmpty from 'lodash/isEmpty';
import * as ecdsa from '@noble/secp256k1';

import {
  generateQueryPath,
  generateRandomClientId,
  getDefaultVaultId,
} from '../helpers/request-helpers';
import { RequestMethod, axiosRequest } from '../lib/axios';
import { getAccountId } from '../lib/db';
import {
  AccountAction,
  AccountResponseObject,
  ApiKeyCredentials,
  ApiOrder,
  ApiWithdrawal,
  Data,
  FundingResponseObject,
  GenericParams,
  HistoricalPnlResponseObject,
  ISO8601,
  ISO31661ALPHA2,
  LiquidityProviderRewardsResponseObject,
  PartialBy,
  PositionResponseObject,
  RetroactiveMiningRewardsResponseObject,
  TradingRewardsResponseObject,
  TransferResponseObject,
  UserResponseObject,
  RestrictionResponseObject,
  UserComplianceResponseObject,
  ProfilePrivateResponseObject,
  ApiOrderWithFlashloan,
  OrderResponseObject,
  WithdrawalHistoryObject,
  DepositHistoryObject,
  ReferralData,
  WithdrawalRequest,
  AcceptedCollateral,
  ReferralNetwork,
  NetworkUserData,
} from '../types';
import Clock from './clock';
import * as flashloanHelpers from '../helpers/flashloan-helpers';

// TODO: Figure out if we can get rid of this.
const METHOD_ENUM_MAP: Record<RequestMethod, ApiMethod> = {
  [RequestMethod.DELETE]: ApiMethod.DELETE,
  [RequestMethod.GET]: ApiMethod.GET,
  [RequestMethod.POST]: ApiMethod.POST,
  [RequestMethod.PUT]: ApiMethod.PUT,
};

// const collateralTokenDecimals = 6;

export default class Private {
  readonly host: string;
  readonly apiKeyCredentials: ApiKeyCredentials;
  readonly networkId: number;
  readonly starkKeyPair?: KeyPair;
  readonly defaultPositionId?: string;
  readonly clock: Clock;
  readonly flashloanAccount: string;
  readonly insuranceAccount: string;
  readonly useECDSA: boolean;

  constructor({
    host,
    apiKeyCredentials,
    starkPrivateKey,
    networkId,
    clock,
    flashloanAccount,
    insuranceAccount,
  }: {
    host: string;
    apiKeyCredentials: ApiKeyCredentials;
    networkId: number;
    starkPrivateKey?: KeyPair;
    clock: Clock;
    flashloanAccount?: string;
    insuranceAccount?: string;
  }) {
    this.host = host;
    this.apiKeyCredentials = apiKeyCredentials;
    this.starkKeyPair = starkPrivateKey;
    this.useECDSA = false;
    if (this.starkKeyPair) {
      this.defaultPositionId = getDefaultVaultId(this.starkKeyPair.publicKey);
    } else {
      const re = /[0-9A-Fa-f]{6}/g;
      const prefixStrippedKey = apiKeyCredentials.secret.replace('0x', '');

      if (
        re.test(prefixStrippedKey) &&
        ecdsa.utils.isValidPrivateKey(ecdsa.utils.hexToBytes(prefixStrippedKey))
      ) {
        this.useECDSA = true;
        this.apiKeyCredentials.secret = prefixStrippedKey;
      }
    }
    this.networkId = networkId;
    this.clock = clock;
    this.flashloanAccount = flashloanAccount;
    this.insuranceAccount = insuranceAccount;
  }

  // ============ Request Helpers ============

  protected async request(
    method: RequestMethod,
    endpoint: string,
    data?: {}
  ): Promise<Data> {
    const requestPath = `/api/v1/private/${endpoint}`;
    const isoTimestamp: ISO8601 = this.clock.getAdjustedIsoString();
    const unsignedHeader = {
      'FLASH1-API-KEY': this.apiKeyCredentials.key,
      'FLASH1-TIMESTAMP': isoTimestamp,
      'FLASH1-PASSPHRASE': this.apiKeyCredentials.passphrase,
    };

    let signature = '';
    const signerPath = {
      requestPath,
      method,
      isoTimestamp,
      data,
    };

    if (this.useECDSA) {
      signature = await this.signECDSA(signerPath);
    } else {
      signature = this.signHmac(signerPath);
    }

    let signedHeaders = {
      ...unsignedHeader,
      'FLASH1-SIGNATURE': signature,
    };

    if (this.apiKeyCredentials.validUntil !== undefined) {
      const newHeader = {
        ...signedHeaders,
        'KEY-VALID-UNTIL': this.apiKeyCredentials.validUntil,
      };
      signedHeaders = newHeader;
    }

    return axiosRequest({
      url: `${this.host}${requestPath}`,
      method,
      data,
      headers: signedHeaders,
    });
  }

  protected async _get(endpoint: string, params: {}): Promise<Data> {
    return this.request(RequestMethod.GET, generateQueryPath(endpoint, params));
  }

  protected async post(endpoint: string, data: {}): Promise<Data> {
    return this.request(RequestMethod.POST, endpoint, data);
  }

  protected async put(endpoint: string, data: {}): Promise<Data> {
    return this.request(RequestMethod.PUT, endpoint, data);
  }

  protected async delete(endpoint: string, params: {}): Promise<Data> {
    return this.request(
      RequestMethod.DELETE,
      generateQueryPath(endpoint, params)
    );
  }

  // ============ Requests ============

  async get(endpoint: string, params: {}): Promise<Data> {
    return this._get(endpoint, params);
  }

  /**
   * @description get a signature for the ethereumAddress if registered
   */
  async getRegistration(
    genericParams: GenericParams = {}
  ): Promise<{ signature: string }> {
    return this._get('registration', {
      ...genericParams,
    });
  }

  /**
   * @description get the signature needed to perform an L1 user registration
   */
  async getL1RegistrationSignature(
    ethAddress: string
  ): Promise<{ signature: string }> {
    const r = new SignableRegistration(
      {
        ethKey: ethAddress,
        starkKey: this.starkKeyPair.publicKey,
      },
      this.networkId
    );
    return { signature: await r.sign(this.starkKeyPair) };
  }

  /**
   * @description get the user associated with the ethereumAddress
   */
  async getUser(
    genericParams: GenericParams = {}
  ): Promise<{ user: UserResponseObject }> {
    return this._get('users', {
      ...genericParams,
    });
  }

  // Not yet supported
  /**
   * @description update information for the user
   *
   * @param {
   * @userData specifiying information about the user
   * @email associated with the user
   * @username for the user
   * @isSharingUsername if the user wants their username publicly shared
   * @isSharingAddress if the user wants their ethereumAddress publicly shared
   * @country for the user (ISO 3166-1 Alpha-2 Compliant)
   * }
   */
  // async updateUser({
  //   userData,
  //   email,
  //   username,
  //   isSharingUsername,
  //   isSharingAddress,
  //   country,
  // }: {
  //   userData: {},
  //   email?: string | null,
  //   username?: string,
  //   isSharingUsername?: boolean,
  //   isSharingAddress?: boolean,
  //   country?: ISO31661ALPHA2,
  // }): Promise<{ user: UserResponseObject }> {
  //   return this.put(
  //     'users',
  //     {
  //       email,
  //       username,
  //       isSharingUsername,
  //       isSharingAddress,
  //       userData: JSON.stringify(userData),
  //       country,
  //     },
  //   );
  // }

  // /**
  //  * @description create an account for an ethereumAddress
  //  *
  //  * @param starkKey for the account that will be used as the public key in starkwareEx-Lib requests
  //  * going forward for this account.
  //  * @param starkKeyYCoordinate for the account that will be used as the Y coordinate for the public
  //  * key in starkwareEx-Lib requests going forward for this account.
  //  */
  // async createAccount(
  //   starkKey: string,
  //   starkKeyYCoordinate: string,
  // ): Promise<{ account: AccountResponseObject }> {
  //   return this.post(
  //     'accounts',
  //     {
  //       starkKey,
  //       starkKeyYCoordinate,
  //     },
  //   );
  // }

  /**
   * @description get account associated with an ethereumAddress and accountNumber 0
   *
   * @param ethereumAddress the account is associated with
   */
  async getAccount(
    ethereumAddress: string,
    genericParams: GenericParams = {}
  ): Promise<{ account: AccountResponseObject }> {
    return this._get(`accounts/${getAccountId({ address: ethereumAddress })}`, {
      ...genericParams,
    });
  }

  /**
   * @description get all accounts associated with an ethereumAddress
   */
  async getAccounts(
    genericParams: GenericParams = {}
  ): Promise<{ accounts: AccountResponseObject[] }> {
    return this._get('accounts', { ...genericParams });
  }

  /**
   * @description get all accounts associated with an ethereumAddress
   */
  async getWithdrawalHistory(
    genericParams: GenericParams = {}
  ): Promise<{ data: WithdrawalHistoryObject[] }> {
    return this.post('withdrawal-history', { ...genericParams });
  }

  /**
   * @description get all accounts associated with an ethereumAddress
   */
  async getDepositHistory(
    genericParams: GenericParams = {}
  ): Promise<{ data: DepositHistoryObject[] }> {
    return this.post('deposit-history', { ...genericParams });
  }

  /**
   * @description get all accounts associated with an ethereumAddress
   */
  async getReferralData(
    genericParams: GenericParams = {}
  ): Promise<{ data: ReferralData }> {
    return this.post('referral-data', { ...genericParams });
  }

  /**
   * @description get all accounts associated with an ethereumAddress
   */
  async generateReferralCode(
    genericParams: GenericParams = {}
  ): Promise<{ data: ReferralData }> {
    return this.post('generate-referral-code', { ...genericParams });
  }

  /**
   * @description get all accounts associated with an ethereumAddress
   */
  async getNetworkUserData(email: string): Promise<{ data: NetworkUserData }> {
    return this.post('get-network-user-data', { email });
  }

  /**
   * @description get all accounts associated with an ethereumAddress
   */
  async cashFillUpBalance(
    email: string,
    cashAmount: number,
    currency: string
  ): Promise<{ data: NetworkUserData }> {
    return this.post('cash-fill-up-balance', { email, cashAmount, currency });
  }

  // Not yet supported
  /**
   * @description get leaderboard pnl for period
   *
   * @param period the period of pnls to retrieve
   */
  // async getAccountLeaderboardPnl(
  //   period: AccountLeaderboardPnlPeriod,
  //   params: {
  //     startedBeforeOrAt?: ISO8601,
  //   },
  //   genericParams: GenericParams = {},
  // ): Promise<{ leaderboardPnl: AccountLeaderboardPnlResponseObject }> {
  //   return this._get(
  //     `accounts/leaderboard-pnl/${period}`,
  //     {
  //       ...params,
  //       ...genericParams,
  //     },
  //   );
  // }

  // Not yet supported
  /**
   * @description get historical leaderboard pnls for period
   *
   * @param period the period of pnls to retrieve
   */
  // async getAccountHistoricalLeaderboardPnl(
  //   period: AccountLeaderboardPnlPeriod,
  //   params: {
  //     limit?: number,
  //   },
  //   genericParams: GenericParams = {},
  // ): Promise<HistoricalLeaderboardPnlsResponseObject> {
  //   return this._get(
  //     `accounts/historical-leaderboard-pnls/${period}`,
  //     {
  //       ...params,
  //       ...genericParams,
  //     },
  //   );
  // }

  /**
   * @description get all positions for an account, meeting query parameters
   */
  async getPositions(): Promise<{ positions: PositionResponseObject[] }> {
    return this._get('positions', {});
  }

  /**
   * @description sign out
   */
  async signOut(): Promise<any> {
    return this.post('signout', {});
  }

  // Not supported yet
  /**
   * @description get orders for a user by a set of query parameters
   *
   * @param {
   * @market the orders are for
   * @status the orders have
   * @side of the book the orders are on
   * @type of order
   * @limit to the number of orders returned
   * @createdBeforeOrAt sets the time of the last fill that will be received
   * @returnLatestOrders returns the latest orders instead of the oldest and the order is
   * from most recent to least recent (up to limit)
   * }
   */
  // async getOrders(
  //   params: {
  //     market?: Market,
  //     status?: OrderStatus,
  //     side?: OrderSide,
  //     type?: OrderType,
  //     limit?: number,
  //     createdBeforeOrAt?: ISO8601,
  //     returnLatestOrders?: boolean,
  //   } = {},
  //   genericParams: GenericParams = {},
  // ): Promise<{ orders: OrderResponseObject[] }> {
  //   return this._get(
  //     'orders',
  //     {
  //       ...params,
  //       ...genericParams,
  //     },
  //   );
  // }

  // Not yet supported
  /**
   * @description get active orders (PENDING, OPEN, UNTRIGGERED) for a user by a set of query
   * parameters - if id is included then side is required
   *
   * @param {
   * @market the orders are for
   * @side of the book the orders are on
   * @id of the order
   * }
   */
  // async getActiveOrders(
  //   market: Market,
  //   side?: OrderSide,
  //   id?: string,
  //   genericParams: GenericParams = {},
  // ): Promise<{ orders: ActiveOrderResponseObject[] }> {
  //   return this._get(
  //     'active-orders',
  //     {
  //       market,
  //       side,
  //       id,
  //       ...genericParams,
  //     },
  //   );
  // }

  // Not yet supported
  /**
   * @description get an order by a unique id
   *
   * @param orderId of the order
   */
  // async getOrderById(
  //   orderId: string,
  //   genericParams: GenericParams = {},
  // ): Promise<{ order: OrderResponseObject }> {
  //   return this._get(
  //     `orders/${orderId}`,
  //     { ...genericParams },
  //   );
  // }

  /**
   * @description get an order by a clientId
   *
   * @param clientId of the order
   */
  async getOpenOrders(): Promise<{ order: OrderResponseObject[] }> {
    return this._get('openorders', {});
  }

  /**
   * @description get an order by a clientId
   *
   * @param clientId of the order
   */
  async getOpenPositions(): Promise<{ order: OrderResponseObject[] }> {
    return this._get('positions', {});
  }

  /**
   * @description get an order by a clientId
   *
   * @param clientId of the order
   */
  async submitWithdrawal(
    params: WithdrawalRequest
  ): Promise<{ message: string }> {
    if (params.assetType !== AcceptedCollateral.USDT) {
      throw new Error('Submitted asset type is not withdrawable');
    }
    return this.post('usdt-withdraw', params);
  }

  /**
   *@description place a new order
   *
   * @param {
   * @instrument of the order (market)
   * @side of the order
   * @orderType of the order
   * @timeInForce of the order
   * @postOnly of the order
   * @size of the order
   * @price of the order
   * @limitFee of the order
   * @expiration of the order
   * @hidden if the order should remain hidden in the orderbook
   * @timeInForce
   * }
   * @param positionId associated with the order
   */
  async submitOrder(
    params: PartialBy<ApiOrder, 'signature' | 'clientId'>
  ): Promise<OrderResponseObject[]> {
    const clientId = generateRandomClientId();
    let signature: string | undefined = params.signature;
    if (!signature) {
      // if (!this.starkKeyPair) {
      //   throw new Error(
      //     'Order is not signed and client was not initialized with starkPrivateKey'
      //   );
      // }
      if (!params.quantity) {
        params.quantity = flashloanHelpers.getHumanReadableQuantity(
          SYNTHETIC_ASSET_MAP[params.instrument],
          params.userCollateral,
          params.leverage,
          params.price
        );
      } else {
        params.quantity = flashloanHelpers.getFlash1QuantizedQuantity(
          SYNTHETIC_ASSET_MAP[params.instrument],
          params.quantity
        );
      }

      if (this.starkKeyPair) {
        const orderToSign: OrderWithClientId = {
          humanSize: params.quantity,
          humanPrice: params.price,
          limitFee: params.limitFee,
          market: params.instrument,
          side: params.side,
          expirationIsoTimestamp: params.expiration,
          positionId: this.defaultPositionId,
          clientId,
        };

        const starkOrder = SignableOrder.fromOrder(orderToSign, this.networkId);
        signature = await starkOrder.sign(this.starkKeyPair);
      }
    }

    const order: ApiOrder = {
      ...params,
      clientId,
      signature,
    };

    return this.post('order', order);
  }

  /**
   *@description place a new short term order
   *
   * @param {
   * @instrument of the order (market)
   * @side of the order
   * @orderType of the order
   * @timeInForce of the order
   * @postOnly of the order
   * @size of the order
   * @price of the order
   * @limitFee of the order
   * @expiration of the order
   * @hidden if the order should remain hidden in the orderbook
   * @flashloan the borrowing amount
   * @timeInForce
   * }
   * @param positionId associated with the order
   */
  async submitShortTermOrder(
    params: PartialBy<
      ApiOrderWithFlashloan,
      | 'signature'
      | 'flashloanSignature'
      | 'insuranceSignature'
      | 'closingOrderSignature'
      | 'clientId'
    >
  ): Promise<OrderResponseObject> {
    const clientId = generateRandomClientId();
    let signature: string | undefined = params.signature;
    let flashloanSignature: string | undefined = params.flashloanSignature;
    let insuranceSignature: string | undefined = params.insuranceSignature;
    let closingOrderSignature: string | undefined =
      params.closingOrderSignature;
    if (!signature) {
      // if (!this.starkKeyPair) {
      //   throw new Error(
      //     'Order is not signed and client was not initialized with starkPrivateKey'
      //   );
      // }

      if (!params.quantity) {
        params.quantity = flashloanHelpers.getHumanReadableQuantityForFlashLoan(
          SYNTHETIC_ASSET_MAP[params.instrument],
          params.flashloan,
          params.leverage,
          params.price
        );
      } else {
        params.quantity = flashloanHelpers.getFlash1QuantizedQuantity(
          SYNTHETIC_ASSET_MAP[params.instrument],
          params.quantity
        );
      }

      if (this.starkKeyPair) {
        const orderToSign: OrderWithClientId = {
          humanSize: params.quantity,
          humanPrice: params.price,
          limitFee: params.limitFee,
          market: params.instrument,
          side: params.side,
          expirationIsoTimestamp: params.expiration,
          positionId: this.defaultPositionId,
          clientId: clientId,
        };

        const starkOrder = SignableOrder.fromOrder(orderToSign, this.networkId);
        const closingStamp = starkOrder.toStarkware().expirationEpochHours;

        const flashLoanTransferToSign: TransferParams = {
          senderPositionId: this.defaultPositionId,
          receiverPositionId: getDefaultVaultId(this.flashloanAccount),
          receiverPublicKey: this.flashloanAccount,
          humanAmount: flashloanHelpers.getFlashloanPriceWithInterest(
            params.flashloan
          ),
          clientId: flashloanHelpers.getFlashLoanReturnTransferSuffix(clientId),
          expirationIsoTimestamp: params.expiration,
        };
        const flashLoanTransferOrder = SignableTransfer.fromTransfer(
          flashLoanTransferToSign,
          this.networkId
        );
        flashLoanTransferOrder.toStarkware().expirationEpochHours =
          closingStamp;
        const insuranceTransferToSign: TransferParams = {
          senderPositionId: this.defaultPositionId,
          receiverPositionId: getDefaultVaultId(this.insuranceAccount),
          receiverPublicKey: this.insuranceAccount,
          humanAmount: flashloanHelpers.getInsurancePremium(params.flashloan),
          clientId:
            flashloanHelpers.getInsurancePremiumTransferSuffix(clientId),
          expirationIsoTimestamp: params.expiration,
        };
        const insuranceTransferOrder = SignableTransfer.fromTransfer(
          insuranceTransferToSign,
          this.networkId
        );
        insuranceTransferOrder.toStarkware().expirationEpochHours =
          closingStamp;
        const closingOrderToSign: OrderWithClientId = {
          humanSize: params.quantity,
          humanPrice: flashloanHelpers.getClosingOrderPrice(
            params.side,
            params.price
          ),
          limitFee: params.limitFee,
          market: params.instrument,
          side:
            params.side === StarkwareOrderSide.BUY
              ? StarkwareOrderSide.SELL
              : StarkwareOrderSide.BUY,
          expirationIsoTimestamp: params.expiration,
          positionId: this.defaultPositionId,
          clientId: flashloanHelpers.getClosingOrderSuffix(clientId),
        };
        const closingOrder = SignableOrder.fromOrder(
          closingOrderToSign,
          this.networkId
        );
        const cc = starkOrder.toStarkware().quantumsAmountCollateral;
        const closingAmount = flashloanHelpers.getClosingOrderCollateralAmount(
          params.side,
          cc
        );
        closingOrder.toStarkware().quantumsAmountCollateral = closingAmount;
        closingOrder.toStarkware().quantumsAmountFee =
          starkOrder.toStarkware().quantumsAmountFee;
        closingOrder.toStarkware().expirationEpochHours = closingStamp;

        [
          signature,
          flashloanSignature,
          insuranceSignature,
          closingOrderSignature,
        ] = await Promise.all([
          starkOrder.sign(this.starkKeyPair),
          flashLoanTransferOrder.sign(this.starkKeyPair),
          insuranceTransferOrder.sign(this.starkKeyPair),
          closingOrder.sign(this.starkKeyPair),
        ]);
      }
    }

    const order: ApiOrderWithFlashloan = {
      ...params,
      clientId,
      signature,
      flashloanSignature,
      insuranceSignature,
      closingOrderSignature,
    };

    return this.post('short-term/order', order);
  }

  /**
   * @description cancel a specific order for a user by the order's unique id
   *
   * @param orderId of the order being canceled
   */
  async cancelOrder(
    orderId: string,
    instrument: string
  ): Promise<{ cancelOrder: OrderResponseObject }> {
    return this.post(`cancel`, {
      orderID: orderId,
      instrument: instrument,
    });
  }

  /**
   * @description cancel all orders for a user
   */
  async cancelAllOrders(): Promise<{ cancelOrders: OrderResponseObject[] }> {
    return this.post('cancelall', {});
  }

  // Not yet supported
  /**
   * @description cancel active orders (PENDING, OPEN, UNTRIGGERED) for a user by a set of query
   * parameters - if id is included then side is required
   *
   * @param {
   * @market the orders are for
   * @side of the book the orders are on
   * @id of the order
   * }
   */
  // async cancelActiveOrders(
  //   market: Market,
  //   side?: OrderSide,
  //   id?: string,
  //   genericParams: GenericParams = {},
  // ): Promise<{ cancelOrders: ActiveOrderResponseObject[] }> {
  //   return this.delete(
  //     'active-orders',
  //     {
  //       market,
  //       side,
  //       id,
  //       ...genericParams,
  //     },
  //   );
  // }

  // Not yet supported
  // /**
  //  *@description get fills for a user by a set of query parameters
  //  *
  //  * @param {
  //  * @market the fills are for
  //  * @orderId associated with the fills
  //  * @limit to the number of fills returned
  //  * @createdBeforeOrAt sets the time of the last fill that will be received
  //  * }
  //  */
  // async getFills(
  //   params: {
  //     market?: Market,
  //     orderId?: string,
  //     limit?: number,
  //     createdBeforeOrAt?: ISO8601,
  //   },
  //   genericParams: GenericParams = {},
  // ): Promise<{ fills: FillResponseObject[] }> {
  //   return this._get(
  //     'fills',
  //     {
  //       ...params,
  //       ...genericParams,
  //     },
  //   );
  // }

  /**
   * @description get transfers for a user by a set of query parameters
   *
   * @param {
   * @type of transfer
   * @limit to the number of transfers returned
   * @createdBeforeOrAt sets the time of the last transfer that will be received
   * }
   */
  async getTransfers(
    params: {
      type?: AccountAction;
      limit?: number;
      createdBeforeOrAt?: ISO8601;
    } = {},
    genericParams: GenericParams = {}
  ): Promise<{ transfers: TransferResponseObject[] }> {
    return this._get('transfers', {
      ...params,
      ...genericParams,
    });
  }

  /**
   * @description post a new withdrawal
   *
   * @param {
   * @amount specifies the size of the withdrawal
   * @asset specifies the asset being withdrawn
   * @clientId specifies the clientId for the address
   * }
   * @param positionId specifies the associated position for the transfer
   */
  async createWithdrawal(
    params: PartialBy<ApiWithdrawal, 'clientId' | 'signature'>
  ): Promise<{ withdrawal: TransferResponseObject }> {
    const clientId = params.clientId || generateRandomClientId();

    let signature: string | undefined = params.signature;
    if (!signature) {
      if (!this.starkKeyPair) {
        throw new Error(
          'Withdrawal is not signed and client was not initialized with starkPrivateKey'
        );
      }
      const withdrawalToSign = {
        humanAmount: params.amount,
        expirationIsoTimestamp: params.expiration,
        clientId,
        positionId: this.defaultPositionId,
        ethAddress: params.ethAddress,
      };
      const starkWithdrawal = SignableWithdrawal.fromWithdrawal(
        withdrawalToSign,
        this.networkId
      );
      signature = await starkWithdrawal.sign(this.starkKeyPair);
    }

    const withdrawal: ApiWithdrawal = {
      ...params,
      clientId,
      signature,
    };

    return this.post('withdrawals', withdrawal);
  }

  /**
   * @description post a new fast-withdrawal
   *
   * @param {
   * @creditAmount specifies the size of the withdrawal
   * @debitAmount specifies the amount to be debited
   * @creditAsset specifies the asset being withdrawn
   * @toAddress is the address being withdrawn to
   * @lpPositionId is the LP positionId for the fast withdrawal
   * @clientId specifies the clientId for the address
   * @signature starkware specific signature for fast-withdrawal
   * }
   */
  // async createFastWithdrawal(
  //   {
  //     lpStarkKey,
  //     ...params
  //   }: PartialBy<ApiFastWithdrawalParams, 'clientId' | 'signature'>,
  //   positionId: string,
  // ): Promise<{ withdrawal: TransferResponseObject }> {
  //   const clientId = params.clientId || generateRandomClientId();
  //   let signature: string | undefined = params.signature;
  //   if (!signature) {
  //     if (!this.starkKeyPair) {
  //       throw new Error('Fast withdrawal is not signed and client was not initialized with starkPrivateKey');
  //     }
  //     const fact = this.starkLib.factRegistry.getTransferErc20Fact({
  //       recipient: params.toAddress,
  //       tokenAddress: this.starkLib.collateralToken.getAddress(),
  //       tokenDecimals: collateralTokenDecimals,
  //       humanAmount: params.creditAmount,
  //       salt: nonceFromClientId(clientId),
  //     });
  //     const transferToSign = {
  //       senderPositionId: positionId,
  //       receiverPositionId: params.lpPositionId,
  //       receiverPublicKey: lpStarkKey,
  //       factRegistryAddress: this.starkLib.factRegistry.getAddress(),
  //       fact,
  //       humanAmount: params.debitAmount,
  //       clientId,
  //       expirationIsoTimestamp: params.expiration,
  //     };
  //     const starkConditionalTransfer = SignableConditionalTransfer.fromTransfer(
  //       transferToSign,
  //       this.networkId,
  //     );
  //     signature = await starkConditionalTransfer.sign(this.starkKeyPair);
  //   }
  //   const fastWithdrawal: ApiFastWithdrawal = {
  //     ...params,
  //     clientId,
  //     signature,
  //   };

  //   return this.post(
  //     'fast-withdrawals',
  //     fastWithdrawal,
  //   );
  // }

  /**
   * @description post a new transfer
   *
   * @param {
   * @amount specifies the size of the transfer
   * @receiverAccountId specifies the receiver account id
   * @receiverPublicKey specifies the receiver public key
   * @receiverPositionId specifies the receiver position id
   * @clientId specifies the clientId for the address
   * @signature starkware specific signature for the transfer
   * }
   * @param positionId specifies the associated position for the transfer
   */
  // async createTransfer(
  //   params: PartialBy<TransferParams, 'clientId' | 'signature'>,
  //   positionId: string,
  // ): Promise<{ transfer: TransferResponseObject }> {
  //   const clientId = params.clientId || generateRandomClientId();

  //   let signature: string | undefined = params.signature;
  //   if (!signature) {
  //     if (!this.starkKeyPair) {
  //       throw new Error(
  //         'Transfer is not signed and client was not initialized with starkPrivateKey',
  //       );
  //     }
  //     const transferToSign: StarklibTransferParams = {
  //       humanAmount: params.amount,
  //       expirationIsoTimestamp: params.expiration,
  //       receiverPositionId: params.receiverPositionId,
  //       senderPositionId: positionId,
  //       receiverPublicKey: params.receiverPublicKey,
  //       clientId,
  //     };
  //     const starkTransfer = SignableTransfer.fromTransfer(transferToSign, this.networkId);
  //     signature = await starkTransfer.sign(this.starkKeyPair);
  //   }

  //   const transfer: ApiTransfer = {
  //     amount: params.amount,
  //     receiverAccountId: params.receiverAccountId,
  //     clientId,
  //     signature,
  //     expiration: params.expiration,
  //   };

  //   return this.post(
  //     'transfers',
  //     transfer,
  //   );
  // }

  /**
   * @description get a user's funding payments by a set of query parameters
   *
   * @param {
   * @market the funding payments are for
   * @limit to the number of funding payments returned
   * @effectiveBeforeOrAt sets the latest funding payment received
   * }
   */
  async getFundingPayments(
    genericParams: GenericParams = {}
  ): Promise<{ data: FundingResponseObject[] }> {
    return this.post('funding-history', {
      ...genericParams,
    });
  }

  /**
   * @description get historical pnl ticks for an account between certain times
   *
   * @param {
   * @createdBeforeOrAt latest historical pnl tick being returned
   * @createdOnOrAfter earliest historical pnl tick being returned
   * }
   */
  getHistoricalPnl(
    params: {
      createdBeforeOrAt?: ISO8601;
      createdOnOrAfter?: ISO8601;
    },
    genericParams: GenericParams = {}
  ): Promise<{ historicalPnl: HistoricalPnlResponseObject[] }> {
    return this._get('historical-pnl', {
      ...params,
      ...genericParams,
    });
  }

  /**
   * @description get trading rewards for a user for a given epoch
   *
   * @param {
   * @epoch to request rewards data for (optional)
   * }
   */
  getTradingRewards(
    params: {
      epoch?: number;
    },
    genericParams: GenericParams = {}
  ): Promise<TradingRewardsResponseObject> {
    return this._get('rewards/weight', {
      ...params,
      ...genericParams,
    });
  }

  /**
   * @description get liquidity provider rewards for a user for a given epoch
   *
   * @param {
   * @epoch to request rewards data for (optional)
   * }
   */
  getLiquidityProviderRewards(
    params: {
      epoch?: number;
    },
    genericParams: GenericParams = {}
  ): Promise<LiquidityProviderRewardsResponseObject> {
    return this._get('rewards/liquidity', {
      ...params,
      ...genericParams,
    });
  }

  /**
   * @description get retroactive mining rewards for a user for a given epoch
   *
   */
  getRetroactiveMiningRewards(
    genericParams: GenericParams = {}
  ): Promise<RetroactiveMiningRewardsResponseObject> {
    return this._get('rewards/retroactive-mining', {
      ...genericParams,
    });
  }

  /**
   * @description get the key ids associated with an ethereumAddress
   *
   */
  async getApiKeys(
    genericParams: GenericParams = {}
  ): Promise<{ apiKeys: { key: string }[] }> {
    return this._get('api-keys', { ...genericParams });
  }

  /**
   * @description send verification email to email specified by User
   */
  async sendVerificationEmail(): Promise<{}> {
    return this.put('emails/send-verification-email', {});
  }

  /**
   * @description requests tokens on flash1's staging server.
   * NOTE: this will not work on Mainnet/Production.
   */
  async requestTestnetTokens(): Promise<{ transfer: TransferResponseObject }> {
    // Ropsten
    if (this.networkId !== 3) {
      throw new Error('Network is not Ropsten');
    }

    return this.post('testnet/tokens', {});
  }

  /**
   * @description get ethereum address restrictions on the flash1 protocol.
   */
  async getRestrictions(
    genericParams: GenericParams = {}
  ): Promise<RestrictionResponseObject> {
    return this._get('restrictions', {
      ...genericParams,
    });
  }

  /**
   * @description comply to flash1 terms of service after a first offense.
   */
  async postRestrictionsCompliance(
    {
      residenceCountry,
      tradingCountry,
    }: {
      residenceCountry: ISO31661ALPHA2;
      tradingCountry: ISO31661ALPHA2;
    },
    genericParams: GenericParams = {}
  ): Promise<UserComplianceResponseObject> {
    return this.post('restrictions/compliance', {
      residenceCountry,
      tradingCountry,
      ...genericParams,
    });
  }

  /**
   * @description get private profile information
   */
  async getProfilePrivate(
    genericParams: GenericParams = {}
  ): Promise<ProfilePrivateResponseObject> {
    return this._get('profile/private', {
      ...genericParams,
    });
  }

  // ============ Signing ============

  signHmac({
    requestPath,
    method,
    isoTimestamp,
    data,
  }: {
    requestPath: string;
    method: RequestMethod;
    isoTimestamp: ISO8601;
    data?: {};
  }): string {
    const messageString: string =
      isoTimestamp +
      METHOD_ENUM_MAP[method] +
      requestPath +
      (isEmpty(data) ? '' : JSON.stringify(data));
    const hmac = crypto.algo.HMAC.create(
      crypto.algo.SHA256,
      crypto.enc.Base64url.parse(this.apiKeyCredentials.secret)
    );
    const base64ParsedMsg = Buffer.from(messageString).toString('base64');
    return hmac.update(base64ParsedMsg).finalize().toString(crypto.enc.Base64);
  }

  async signECDSA({
    requestPath,
    method,
    isoTimestamp,
    data,
  }: {
    requestPath: string;
    method: RequestMethod;
    isoTimestamp: ISO8601;
    data?: {};
  }): Promise<string> {
    const messageString: string =
      isoTimestamp +
      METHOD_ENUM_MAP[method] +
      requestPath +
      (isEmpty(data) ? '' : JSON.stringify(data));
    const msg = Buffer.from(messageString);
    const hashedMessage = await ecdsa.utils.sha256(msg);
    let keyToSign = this.apiKeyCredentials.secret;
    if (this.apiKeyCredentials.secret.startsWith('0x')) {
      keyToSign = this.apiKeyCredentials.secret.replace('0x', '');
    }

    const signature = await ecdsa.sign(
      hashedMessage,
      ecdsa.utils.hexToBytes(keyToSign)
    );

    return ecdsa.utils.bytesToHex(signature);
  }
}
