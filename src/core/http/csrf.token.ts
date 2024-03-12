import { generate } from '../utils/crypto.utils';
import { HttpSecurity } from './http.security';

export type RequestCsrfGetter = (request: any) => string;

export class CsrfToken {
  /**
   * @internal
   */
  static TOKE_NAME = 'x-csrf-token';

  /**
   * @internal
   */
  constructor(
    /**
     * @internal
     */
    private readonly sessionKey: string,
    /**
     * @internal
     */
    private cookieOptions: CookieOptions,
    /**
     * @internal
     */
    private requestGetters: RequestCsrfGetter[]
  ) {}

  /**
   * @internal
   * @param request
   */
  create(request: any, response: any) {
    const token = generate(50);
    request.session[this.sessionKey] = token;
    const cookieHeaderValue = generateCookieHeaderValue(
      CsrfToken.TOKE_NAME,
      token,
      this.cookieOptions
    );
    response.header('Set-Cookie', cookieHeaderValue);
    return this;
  }

  /**
   * @internal
   */
  delete(request: any, response: any) {
    delete request.session[this.sessionKey];
    response.clearCookie(CsrfToken.TOKE_NAME);
  }

  /**
   * @internal
   * @param request
   */
  check(request: any): boolean {
    const token = request.session[this.sessionKey];
    if (!token) {
      return false;
    }
    for (const requestGetter of this.requestGetters) {
      const requestToken = requestGetter(request);
      if (requestToken === token) {
        return true;
      }
    }
    return false;
  }

  getToken(request: any): string {
    return request.session[this.sessionKey];
  }
}

export class CsrfTokenBuilder {
  /**
   * @internal
   */
  private disabled: boolean = true;
  /**
   * @internal
   */
  private _sessionKey = 'x-csrf-token';
  /**
   * @internal
   */
  private _url: string = '/csrf/token';
  /**
   * @internal
   */
  private cookieOptions: CookieOptions = { sameSite: 'Strict', path: '/' };

  /**
   * @internal
   */
  private requestGetters: RequestCsrfGetter[] = [
    (request) => {
      return request.cookies[CsrfToken.TOKE_NAME];
    }
  ];

  /**
   * @internal
   * @param httpSecurity
   */
  constructor(
    /**
     * @internal
     */
    private readonly httpSecurity: HttpSecurity
  ) {}

  sessionKey(key: string): this {
    if (typeof key === 'string' && key.length > 0) {
      this._sessionKey = key;
    }
    return this;
  }

  url(url: string): this;
  /**
   * @internal
   */
  url(): string;
  url(url?: string): this | string {
    if (url === undefined) {
      return this._url;
    }
    this._url = url;
    return this;
  }

  cookie(cookieOptions?: CookieOptions) {
    if (cookieOptions !== undefined) {
      this.cookieOptions = cookieOptions;
    }
    return this;
  }

  addGetter(requestGetter: RequestCsrfGetter): this {
    this.requestGetters.push(requestGetter);
    return this;
  }

  /**
   * @internal
   */
  enabled() {
    return !this.disabled;
  }

  enable(): this {
    this.disabled = false;
    return this;
  }

  and() {
    return this.httpSecurity;
  }

  /**
   * @internal
   */
  build(): CsrfToken {
    return new CsrfToken(
      this._sessionKey,
      this.cookieOptions,
      this.requestGetters
    );
  }
}

/**
 * @internal
 */
export class CsrfTokenError extends Error {}

/**
 * @internal
 * @param name
 * @param value
 * @param options
 */
function generateCookieHeaderValue(
  name: string,
  value: string,
  options: CookieOptions
): string {
  const cookieParts = [`${name}=${value}`];
  if (options) {
    if (options.path) cookieParts.push(`Path=${options.path}`);
    if (options.expires) {
      const expires =
        options.expires instanceof Date
          ? options.expires.toUTCString()
          : options.expires;
      cookieParts.push(`Expires=${expires}`);
    }
    if (options.maxAge) cookieParts.push(`Max-Age=${options.maxAge}`);
    if (options.domain) cookieParts.push(`Domain=${options.domain}`);
    if (options.secure) cookieParts.push(`Secure`);
    if (options.httpOnly) cookieParts.push(`HttpOnly`);
    if (options.sameSite) cookieParts.push(`SameSite=${options.sameSite}`);
  }

  return cookieParts.join('; ');
}

export interface CookieOptions {
  /**
   * The domain for which the cookie is valid.
   */
  domain?: string;

  /**
   * The path for which the cookie is valid.
   */
  path?: string;

  /**
   * The expiration date of the cookie, in milliseconds since the UNIX epoch.
   */
  expires?: number | Date;

  /**
   * The maximum age of the cookie, in seconds.
   */
  maxAge?: number;

  /**
   * Indicates whether the cookie should be sent only over secure connections (HTTPS).
   */
  secure?: boolean;

  /**
   * Indicates whether the cookie should be accessible only via HTTP(S) and not JavaScript.
   */
  httpOnly?: boolean;

  /**
   * Indicates whether the cookie should be included in same-site requests only.
   * Possible values are 'Strict', 'Lax', or 'None'.
   */
  sameSite?: 'Strict' | 'Lax' | 'None';

  /**
   * Indicates the priority of the cookie relative to others.
   */
  priority?: 'Low' | 'Medium' | 'High';
}
