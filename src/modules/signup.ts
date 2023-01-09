import { RequestMethod, axiosRequest } from '../lib/axios';
import {
  AccountResponseObject,
  ApiKeyCredentials,
  Data,
  ISO31661ALPHA2,
  UserResponseObject,
} from '../types';

/*
  Handles Sign Up & Sign In -> for centralized backend
*/

export default class SignUp {
  readonly host: string;

  constructor(host: string) {
    this.host = host;
  }

  // ============ Request Helpers ============

  protected async post(endpoint: string, data: {}): Promise<Data> {
    const url = `/api/v1/public/${endpoint}`;
    return axiosRequest({
      url: `${this.host}${url}`,
      method: RequestMethod.POST,
      data,
      headers: {
        'FLASH1-SIGNATURE': '',
        'FLASH1-ETHEREUM-ADDRESS': '',
      },
    });
  }

  // ============ Requests ============

  /**
   * @description create a user, account and apiKey in one onboarding request
   *
   * @param {
   * @starkKey is the unique public key for starkwareLib operations used in the future
   * @starkKeyYCoordinate is the Y Coordinate of the unique public key for starkwareLib
   * operations used in the future
   * }
   * @param ethereumAddress of the account
   * @param signature validating the request
   * @param signingMethod for the request
   * @param referredByAffiliateLink of affiliate who referred the user
   * @param country for the user (ISO 3166-1 Alpha-2 Compliant)
   */
  async createUser(params: {
    email: string;
    password: string;
    referredByAffiliateLink?: string;
    country?: ISO31661ALPHA2;
  }): Promise<{
    apiKey: ApiKeyCredentials;
    user: UserResponseObject;
    account: AccountResponseObject;
  }> {
    return this.post('signup', params);
  }

  /**
   * @description Derive an API key pair deterministically from an Ethereum key.
   *
   * This is used by the frontend app to recover the default API key credentials.
   *
   * @param ethereumAddress Ethereum address of the account to use for signing.
   * @param signingMethod Method to use for signing.
   */
  async signIn(params: { email: string; password: string }): Promise<{
    apiKey: ApiKeyCredentials;
  }> {
    return this.post('signin', params);
  }
}
