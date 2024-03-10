import { WebAuthenticationProvider } from '../../abstract/web-authentication.provider';
import { generate, md5 } from '../../../utils/crypto.utils';
import { Authenticator } from '../../abstract/authenticator';
import { DigestAlgorithm, DigestOptions } from './digest.options';
import { Authentication } from '../../abstract/model/authentication';

const CREDENTIALS_REGEXP = /^digest\s(.*)/i;
const PARAMS_SPLITER_REGEXP = /,(?=(?:[^"]|"[^"]*")*$)/;
const STRIP_QUOTES_WHITESPACE_REGEXP = /(\w+)=["]?([^"]*)["]?$/;

/**
 * @internal
 */
export interface Options {
  algorithm: DigestAlgorithm;
  qop: string;
  response: string;
  nonce: string;
  cnonce: string;
  nc: string;
}

/**
 * Class for WWW-Authenticate Digest implementation
 */
// @ts-ignore
export class DigestWebAuthenticationProvider extends WebAuthenticationProvider {
  /**
   * @internal
   * @private
   */
  private nonces: Nonce[] = [];
  /**
   * @internal
   * @private
   */
  private opaques: Opaque[] = [];

  /**
   * @internal
   * @param authenticator
   * @param options
   */
  constructor(
    authenticator: Authenticator,
    private options: DigestOptions
  ) {
    super(authenticator, CREDENTIALS_REGEXP, options);
  }

  /**
   * @internal
   * @private
   */
  protected async parse(
    authorization: RegExpExecArray,
    request: any
  ): Promise<Authentication> {
    const params = authorization[1];
    // Split the parameters by comma.
    const tokens = params.split(PARAMS_SPLITER_REGEXP);
    const options: any = {};
    // Parse parameters.
    let i = 0;
    const len = tokens.length;
    while (i < len) {
      // Strip quotes and whitespace.
      const param = STRIP_QUOTES_WHITESPACE_REGEXP.exec(tokens[i]);
      if (param) {
        options[param[1]] = param[2];
      }
      ++i;
    }
    if (this.validate(options)) {
      const ha2 = md5(`${request.method}:${options.uri}`);
      return this.validateUser(options.username, ha2, options);
    }
    return undefined;
  }

  /**
   * @internal
   * @param username
   * @param ha2
   * @param options
   * @private
   */
  private async validateUser(
    username: string,
    ha2: string,
    options: Options
  ): Promise<Authentication> {
    const user = await this.authenticator.authenticate(username);
    if (user) {
      let ha1 = md5(
        `${user.username}:${this.options.realm()}:${user.password}`
      );
      // Algorithm.
      if (options.algorithm === 'MD5-sess') {
        ha1 = md5(`${ha1}:${options.nonce}:${options.cnonce}`);
      }
      const response = options.qop
        ? md5(
            `${ha1}:${options.nonce}:${options.nc}:${options.cnonce}:${options.qop}:${ha2}`
          )
        : md5(`${ha1}:${options.nonce}:${ha2}`);
      // If calculated response is equal to client's response.

      return response === options.response ? user : undefined;
    }
    return undefined;
  }

  /**
   * @internal
   * @private
   */
  protected getAskHeaderValue(): string {
    const nonce = md5(generate(10));
    this.nonces.push({
      id: nonce,
      date: Date.now(),
      nc: 0
    });
    const options = [`Digest realm="${this.options.realm()}"`];
    if (this.options.domain()) {
      options.push(`domain="${this.options.domain()}"`);
    }
    options.push(`nonce="${nonce}"`);
    if (this.options.isOpaque()) {
      const opaque = md5(generate(10));
      this.opaques.push({ id: nonce, date: Date.now(), nop: 0 });
      options.push(`opaque="${opaque}"`);
    }
    if (this.options.algorithm()) {
      options.push(`algorithm="${this.options.algorithm()}"`);
    }
    if (this.options.isQop()) {
      options.push(`qop="auth"`);
    }
    return options.join(', ');
  }

  /**
   * @internal
   * @private
   */
  // Validate nonce.
  private validate(options: Options) {
    let found = false;
    // Nonces for removal.
    const noncesToRemove: Nonce[] = [];
    // Current time.
    const now = Date.now();
    // Searching for not expired ones.
    this.nonces.forEach((serverNonce) => {
      if (serverNonce.date + 3600000 > now) {
        if (serverNonce.id === options.nonce) {
          if (options.qop) {
            // Request counter is hexadecimal.
            const ncNum = Number.parseInt(options.nc, 16);
            if (ncNum > serverNonce.nc) {
              found = true;
              serverNonce.nc = ncNum;
            }
          } else {
            found = true;
          }
        }
      } else {
        noncesToRemove.push(serverNonce);
      }
    });
    // Remove expired nonces.
    this.removeNonces(...noncesToRemove);
    // TODO validate opaque
    return found;
  }

  /**
   * @internal
   * @private
   */
  // Remove nonces.
  private removeNonces(...noncesToRemove: Nonce[]) {
    noncesToRemove.forEach((nonce) => {
      const index = this.nonces.indexOf(nonce);
      if (index !== -1) {
        this.nonces.splice(index, 1);
      }
    });
  }
}

/**
 * @internal
 * @private
 */
interface Opaque {
  id: string;
  date: number;
  nop: number;
}

/**
 * @internal
 * @private
 */
interface Nonce {
  id: string;
  date: number;
  nc: number;
}
