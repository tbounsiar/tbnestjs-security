import { base64Decode } from '../../../utils/crypto.utils';
import { WebAuthenticationProvider } from '../../abstract/web-authentication.provider';
import { Authenticator } from '../../abstract/authenticator';
import { BasicOptions } from './basic.options';
import { Authentication } from '../../abstract/model/authentication';

const CREDENTIALS_REGEXP = /^basic\s(.*)/i;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

/**
 * Class for WWW-Authenticate Basic implementation
 */
// @ts-ignore
export class BasicWebAuthenticationProvider extends WebAuthenticationProvider {
  /**
   * @internal
   * @param authenticator
   * @param options
   */
  constructor(
    authenticator: Authenticator,
    private options: BasicOptions
  ) {
    super(authenticator, CREDENTIALS_REGEXP, options);
  }

  /**
   * @internal
   * @private
   */
  protected getAskHeaderValue(): string {
    return `Basic realm="${this.options.realm()}", charset="${this.options.charset()}"`;
  }

  /**
   * @internal
   * @private
   */
  protected async parse(
    authorization: RegExpExecArray
  ): Promise<Authentication> {
    // decode user pass
    const userPassword = USER_PASS_REGEXP.exec(
      base64Decode(authorization[1], this.options.charset())
    );
    if (!userPassword) {
      return undefined;
    }
    return this.authenticator.authenticate(userPassword[1], userPassword[2]);
  }
}
