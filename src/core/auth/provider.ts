import { MemoryStore } from './impl/memory.authenticator';
import { BasicOptions } from './impl/basic/basic.options';
import { DigestOptions } from './impl/digest/digest.options';
import { JwtTokenOptions } from './token/jwt/jwt-token.options';
import { SessionOptions } from './impl/session/session.options';

export class Provider {
  static sessionAuthentication(): SessionOptions {
    return new SessionOptions();
  }

  static basicAuthentication(): BasicOptions {
    return new BasicOptions();
  }

  static digestAuthentication(): DigestOptions {
    return new DigestOptions();
  }

  static jwtTokenAuthentication(secret: string): JwtTokenOptions {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jwt = require('jsonwebtoken');
    if (!jwt) {
      throw new Error(
        'Package jsonwebtoken seems not to be installed, please do `npm i -S jsonwebtoken and retry`'
      );
    }
    return new JwtTokenOptions(secret, jwt);
  }

  static inMemoryAuthenticator(): MemoryStore {
    return new MemoryStore();
  }
}
