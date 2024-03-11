import { base64Decode } from '../../../utils/crypto.utils';
import { WebAuthenticationProvider } from '../../abstract/web-authentication.provider';
import { UserAuthenticator } from '../../abstract/user.authenticator';
import { BasicOptions } from './basic.options';
import { UserAuthentication } from '../../abstract/model/user.authentication';

const CREDENTIALS_REGEXP = /^basic\s(.*)/i;
const USER_PASS_REGEXP = /^([^:]*):(.*)$/;

/**
 * @internal
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
    authenticator: UserAuthenticator,
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
  ): Promise<UserAuthentication> {
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
