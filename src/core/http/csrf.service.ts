import { generate } from '../utils/crypto.utils';
import { HttpSecurity } from './httpSecurity';


export type RequestCsrfGetter = (request: any) => string;

/**
 * @internal
 */
export class CsrfService {

  private requestGetters: RequestCsrfGetter[] = [(request) => request.headers['x-csrf-token']];

  /**
   * @internal
   */
  constructor(
    private readonly _sessionKey: string,
  ) {
  }

  addGetter(requestGetter: RequestCsrfGetter): this {
    this.requestGetters.push(requestGetter);
    return this;
  }

  sessionKey(): string {
    return this._sessionKey;
  }

  generate(): string {
    return generate(50);
  }

  check(request: any): boolean {
    const token = request.session[this._sessionKey];
    for (const requestGetter of this.requestGetters) {
      if (requestGetter(request) === token) {
        return true;
      }
    }
    return false;
  }

  getToken(request: any): string {
    return request.session[this._sessionKey];
  }
}

export class CsrfBuilder {

  private disabled: boolean = true;
  private _sessionKey = 'x-csrf-token';

  /**
   * @internal
   * @param httpSecurity
   */
  constructor(
    private readonly httpSecurity: HttpSecurity,
  ) {
  }

  sessionKey(key: string): this {
    if (typeof key === 'string' && key.length > 0) {
      this._sessionKey = key;
    }
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
  build(): CsrfService {
    return new CsrfService(this._sessionKey);
  }
}