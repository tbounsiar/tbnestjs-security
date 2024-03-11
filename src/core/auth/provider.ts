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

  static jwtTokenAuthentication(): JwtTokenOptions {
    return new JwtTokenOptions();
  }

  static inMemoryAuthenticator(): MemoryStore {
    return new MemoryStore();
  }
}
