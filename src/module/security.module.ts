import { DynamicModule, Logger, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SecurityGuard } from '../guard/security.guard';
import { createLoginController } from '../controller/login.controller';
import { LoginService } from '../service/login.service';
import { Reflector } from '@nestjs/core/services/reflector.service';
import { Provider } from '../core/auth/provider';
import { createSecurityExceptionFilter } from '../filter/security-exception.filter';
import { AuthenticateType, AuthenticationProvider } from '../core/auth/abstract/authenticationProvider';
import { Authenticator } from '../core/auth/abstract/authenticator';
import { AuthErrorHandling } from '../core/auth/abstract/authErrorHandling';
import { HttpSecurity } from '../core/http/httpSecurity';
import {
  FormLogin,
  sessionAndFormMessage,
  SessionAuthenticationProvider,
} from '../core/auth/impl/sessionAuthenticationProvider';
import { AuthenticationBuilder } from '../core/auth/authenticationBuilder';
import { Type } from '@nestjs/common/interfaces/type.interface';

@Module({})
export class SecurityModule {

  /**
   * @internal
   * @private
   */
  private static readonly logger = new Logger(SecurityModule.name);

  static forRoot(config: SecurityConfig): DynamicModule {
    const controllers = [];
    const authenticationProvider = config
      .authenticationBuilder()
      .authenticationProvider();

    const providers: any[] = [
      {
        provide: APP_FILTER,
        useClass: createSecurityExceptionFilter(),
      },
      {
        provide: APP_GUARD,
        useClass: SecurityGuard,
      },
      {
        provide: AuthenticationProvider,
        useValue: authenticationProvider,
      },
      {
        provide: Authenticator,
        useValue: config.authenticationBuilder().authenticator(),
      },
      {
        provide: AuthErrorHandling,
        useValue: config.authenticationBuilder().errorHandling(),
      },
      {
        provide: HttpSecurity,
        useValue: config.httpSecurity(),
      },
      Reflector,
    ];

    // @ts-ignore
    const exports: (string | Type)[] = [];

    if (
      authenticationProvider.authenticateType() === AuthenticateType.FORM_LOGIN
    ) {
      this.logger.warn(sessionAndFormMessage);
      // this.logger.warn(`Be sure to set application session. app.use(session({secret: "secret"}));`);
      const formLogin = (
        authenticationProvider as SessionAuthenticationProvider
      ).formLogin();
      providers.push({
        provide: FormLogin,
        useValue: formLogin
      });
      if (formLogin.isDefaultEnabled()) {
        controllers.push(createLoginController(formLogin));
      }
      if (formLogin.isLoginService()) {
        providers.push(LoginService);
        exports.push(LoginService);
      }
    }
    return {
      module: SecurityModule,
      providers,
      exports,
      controllers,
      global: true,
    };
  }
}

export class SecurityConfig {

  /**
   * @internal
   */
  constructor(
    /**
     * @internal
     */
    private _httpSecurity: HttpSecurity,
    /**
     * @internal
     */
    private _authenticationBuilder: AuthenticationBuilder,
  ) {
  }

  httpSecurity(): HttpSecurity {
    return this._httpSecurity;
  }

  authenticationBuilder(): AuthenticationBuilder {
    return this._authenticationBuilder;
  }

  static builder(): SecurityConfigBuilder {
    return new SecurityConfigBuilder();
  }
}

export class SecurityConfigBuilder {
  /**
   * @internal
   * @private
   */
  private _httpSecurity: HttpSecurity = new HttpSecurity(this);
  /**
   * @internal
   * @private
   */
  private _authenticationBuilder = new AuthenticationBuilder(this);
  /**
   * @internal
   * @private
   */
  private provider = new Provider(this._authenticationBuilder);

  /**
   * @internal
   */
  constructor() {
    this._authenticationBuilder.authenticationProvider(this.provider.basicAuthentication());
  }

  httpSecurity(): HttpSecurity {
    return this._httpSecurity;
  }

  authenticationBuilder(): AuthenticationBuilder {
    return this._authenticationBuilder;
  }

  provide(): Provider {
    return this.provider;
  }

  build(): SecurityConfig {
    return new SecurityConfig(this._httpSecurity, this._authenticationBuilder);
  }
}
