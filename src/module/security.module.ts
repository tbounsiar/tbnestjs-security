import { DynamicModule, FactoryProvider, Logger, Module, Type } from '@nestjs/common';
import { APP_FILTER, Reflector } from '@nestjs/core';
import { securityGuardProvider } from '../guard/security.guard';
import { createLoginController } from '../controller/login.controller';
import { LoginService } from '../service/login.service';
import { createSecurityExceptionFilter } from '../filter/security-exception.filter';
import { HttpSecurity } from '../core/http/http.security';
import { sessionAndFormMessage } from '../core/auth/impl/session/session.authentication.provider';
import { AuthenticationBuilder } from '../core/auth/authentication.builder';
import { CsrfToken } from '../core/http/csrf.token';
import { createCsrfController } from '../controller/csrf.controller';
import { MemoryAuthenticator, MemoryStore } from '../core/auth/impl/memory.authenticator';
import { SessionOptions } from '../core/auth/impl/session/session.options';
import { authenticationProvider, ProviderOptions } from '../core/auth/abstract/authentication.provider';
import { Authenticator } from '../core/auth/abstract/authenticator';
import { AuthenticationErrorHandling } from '../core/auth/abstract/authentication-error.handling';
import { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import { FormLogin } from '../core/auth/impl/session/form-login';

@Module({})
export class SecurityModule {
  /**
   * @internal
   * @private
   */
  private static readonly logger = new Logger(SecurityModule.name);

  static forRoot(config: SecurityConfig): DynamicModule {
    const metadata = {
      controllers: config.metadata()?.controllers || [],
      providers: config.metadata()?.providers || [],
      exports: config.metadata()?.exports || []
    };

    metadata.providers.push(
      {
        provide: APP_FILTER,
        useClass: createSecurityExceptionFilter()
      },
      {
        provide: HttpSecurity,
        useValue: config.httpSecurity()
      },
      {
        provide: AuthenticationErrorHandling,
        useValue: config.authenticationBuilder().errorHandling()
      },
      authenticationProvider,
      securityGuardProvider,
      Reflector
    );

    let csrfToken: CsrfToken;
    if (config.httpSecurity().csrf().enabled()) {
      csrfToken = config.httpSecurity().csrf().build();
      metadata.providers.push({
        provide: CsrfToken,
        useValue: csrfToken
      });
      metadata.exports.push(CsrfToken);
      metadata.controllers.push(
        createCsrfController(config.httpSecurity().csrf())
      );
      config.httpSecurity().csrfToken(csrfToken);
    }

    const authenticator = config.authenticationBuilder().authenticator();

    if (authenticator) {
      if (authenticator instanceof MemoryStore) {
        metadata.providers.push({
          provide: Authenticator,
          useValue: new MemoryAuthenticator(authenticator)
        });
      } else {
        if ('useFactory' in authenticator) {
          metadata.providers.push(authenticator);
        } else {
          metadata.providers.push({
            provide: Authenticator,
            useClass: authenticator as Type<Authenticator>
          });
        }
      }
      metadata.exports.push(Authenticator);
    }

    const providerOptions = config
      .authenticationBuilder()
      .authenticationProvider();

    if (providerOptions instanceof ProviderOptions) {

      metadata.providers.push(providerOptions.optionProvider());

      if (providerOptions instanceof SessionOptions) {
        this.logger.warn(sessionAndFormMessage);
        if (csrfToken) {
          providerOptions.csrfToken(csrfToken);
        } else {
          this.logger.warn(
            'You are using authentication session but CSRF protection is not enabled!'
          );
        }
        const formLogin = providerOptions.formLogin();
        metadata.providers.push({
          provide: FormLogin,
          useValue: formLogin
        });
        if (formLogin.isDefaultEnabled()) {
          metadata.controllers.push(createLoginController(formLogin));
        }
        if (formLogin.isLoginService()) {
          metadata.providers.push(LoginService);
          metadata.exports.push(LoginService);
        }
      }
      metadata.providers.push(providerOptions.providerProvider());
      // metadata.exports.push(providerOptions.providerType())
    }

    return {
      module: SecurityModule,
      ...metadata,
      global: true
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
    private _metadata: ModuleMetadata
  ) {
  }

  httpSecurity(): HttpSecurity {
    return this._httpSecurity;
  }

  authenticationBuilder(): AuthenticationBuilder {
    return this._authenticationBuilder;
  }

  metadata() {
    return this._metadata;
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

  private _metadata: ModuleMetadata;

  /**
   * @internal
   */
  constructor() {
  }

  httpSecurity(): HttpSecurity {
    return this._httpSecurity;
  }

  authenticationBuilder(): AuthenticationBuilder {
    return this._authenticationBuilder;
  }

  metadata(metadata: ModuleMetadata) {
    this._metadata = metadata;
    return this;
  }

  build(): SecurityConfig {
    return new SecurityConfig(
      this._httpSecurity,
      this._authenticationBuilder,
      this._metadata
    );
  }
}
