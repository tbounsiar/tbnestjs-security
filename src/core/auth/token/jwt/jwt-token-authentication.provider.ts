import { TokenAuthenticationProvider } from '../token-authentication.provider';
import { JwtTokenParser } from './jwt-token.parser';
import { JwtTokenOptions } from './jwt-token.options';

/**
 * @internal
 */
export class JwtTokenAuthenticationProvider extends TokenAuthenticationProvider {
  /**
   * @internal
   */
  constructor(options: JwtTokenOptions) {
    super(options);
    this.tokenParser(
      options.tokenParser() || new JwtTokenParser(options.secret())
    );
  }
}
