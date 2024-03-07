import { AuthenticationBuilder } from './authenticationBuilder';
import { SessionAuthenticationProvider } from './impl/sessionAuthenticationProvider';
import { AuthenticateType } from './abstract/authenticationProvider';
import { BasicWebAuthenticationProvider } from './impl/basicWebAuthenticationProvider';
import { DigestWebAuthenticationProvider } from './impl/digestWebAuthenticationProvider';
import { TokenAuthenticationProvider } from './token/tokenAuthenticationProvider';
import { JwtTokenAuthenticationProvider } from './token/jwt/jwtTokenAuthenticationProvider';
import { MemoryAuthenticator } from './impl/memoryAuthenticator';

export class Provider {

  /**
   * @internal
   * @param authenticationBuilder
   */
  constructor(
    /**
     * @internal
     */
    private authenticationBuilder: AuthenticationBuilder,
  ) {
  }

  sessionAuthentication(): SessionAuthenticationProvider {
    return new SessionAuthenticationProvider(AuthenticateType.SESSION);
  }

  basicAuthentication(): BasicWebAuthenticationProvider {
    return new BasicWebAuthenticationProvider(
      this.authenticationBuilder,
    );
  }

  digestAuthentication(): DigestWebAuthenticationProvider {
    return new DigestWebAuthenticationProvider(
      this.authenticationBuilder,
    );
  }

  tokenAuthentication(): TokenAuthenticationProvider {
    return new TokenAuthenticationProvider();
  }

  jwtTokenAuthentication(
    secret: string,
  ): JwtTokenAuthenticationProvider {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwt = require('jsonwebtoken');
    if (!jwt) {
      throw new Error(
        'Package jsonwebtoken seems not to be installed, please do `npm i -S jsonwebtoken and retry`',
      );
    }
    return new JwtTokenAuthenticationProvider(secret, jwt);
  }

  inMemoryAuthenticator(): MemoryAuthenticator {
    return new MemoryAuthenticator();
  }
}
