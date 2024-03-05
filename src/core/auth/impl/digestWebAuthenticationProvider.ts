import { WebAuthenticationProvider } from './webAuthenticationProvider';
import { md5 } from '../../utils/crypto-utils';
import { generate } from '../../utils/utils';
import { Authentication } from '../abstract/authentication';
import { AuthenticateType } from '../abstract/authenticationProvider';
import { AuthenticationBuilder } from '../authenticationBuilder';

const CREDENTIALS_REGEXP = /^digest\s(.*)/i;
const PARAMS_SPLITER_REGEXP = /,(?=(?:[^"]|"[^"]*")*$)/;
const STRIP_QUOTES_WHITESPACE_REGEXP = /(\w+)=["]?([^"]*)["]?$/;


/**
 * @internal
 * @private
 */
interface Nonce {
  id: string;
  date: number;
  nc: number;
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

export type DigestAlgorithm = 'MD5' | 'MD5-sess';

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
   * @private
   */
  private _domain: string;
  /**
   * @internal
   * @private
   */
  private _opaque = false;
  /**
   * @internal
   * @private
   */
  private _algorithm: DigestAlgorithm;
  /**
   * @internal
   * @private
   */
  private _qop = false;

  /**
   * @internal
   * @param authenticationBuilder
   */
  constructor(authenticationBuilder: AuthenticationBuilder) {
    super(AuthenticateType.DIGEST, CREDENTIALS_REGEXP, authenticationBuilder);
  }

  /**
   * Set WWW-Authenticate Digest domain
   * @param domain {string}: domain value
   */
  domain(domain: string): this {
    this._domain = domain;
    return this;
  }

  /**
   * Activate WWW-Authenticate Digest opaque
   */
  opaque(): this {
    this._opaque = true;
    return this;
  }

  /**
   * Set WWW-Authenticate Digest algorithm
   * @param algorithm {DigestAlgorithm}: algorithm value
   */
  algorithm(algorithm: DigestAlgorithm): this {
    this._algorithm = algorithm;
    return this;
  }

  /**
   * Set WWW-Authenticate Digest qop 'auth'
   */
  qop(): this {
    this._qop = true;
    return this;
  }

  /**
   * @internal
   * @private
   */
  protected parse(authorization: RegExpExecArray, request: any): Authentication {

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
      let ha2 = md5(`${request.method}:${options.uri}`);
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
  private validateUser(username: string, ha2: string, options: Options): Authentication {
    const user = this.authenticationBuilder.authenticator().authenticate(username);
    if (user) {
      let ha1 = md5(`${user.username}:${this._realm}:${user.password}`);
      // Algorithm.
      if (options.algorithm === 'MD5-sess') {
        ha1 = md5(`${ha1}:${options.nonce}:${options.cnonce}`);
      }
      let response = options.qop ?
        md5(
          `${ha1}:${options.nonce}:${options.nc}:${options.cnonce}:${options.qop}:${ha2}`,
        ) :
        md5(`${ha1}:${options.nonce}:${ha2}`);
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
        nc: 0,
      },
    );
    const options = [`Digest realm="${this._realm}"`];
    if (this._domain) {
      options.push(`domain="${this._domain}"`);
    }
    options.push(`nonce="${nonce}"`);
    if (this._opaque) {
      const opaque = md5(generate(10));
      this.opaques.push({ id: nonce, date: Date.now(), nop: 0 });
      options.push(`opaque="${opaque}"`);
    }
    if (this._algorithm) {
      options.push(`algorithm="${this._algorithm}"`);
    }
    if (this._qop) {
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
