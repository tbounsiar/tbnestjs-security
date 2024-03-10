import { ProviderOptions } from '../../../src/core/auth/abstract/authentication.provider';
import {
  AuthorizeRequests,
  DigestAlgorithm,
  MemoryAuthentication,
  Provider,
  RequestMatcher,
  SecurityConfig,
  SecurityModule
} from '../../../src';
import { RequestMethod } from '@nestjs/common';
// @ts-ignore
import { TestModule } from '../module/test.module';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
// @ts-ignore
import { Context } from './app.test';
import { WwwOptions } from '../../../src/core/auth/abstract/www-authentication.provider';
import * as secureSession from '@fastify/secure-session';
import * as session from 'express-session';
import * as cookieParser from 'cookie-parser';
import { CookieOptions } from '../../../src/core/http/csrf.token';
import { SessionOptions } from '../../../src/core/auth/impl/session/session.options';

export interface Form {
  pageUrl?: string;
  loginUrl?: string;
  logoutUrl?: string;
  disableDefault?: boolean;
  disableLoginService?: boolean;
}

export interface Options {
  proxy?: boolean;
  opaque?: boolean;
  qop?: boolean | string;
  domain?: string;
  algorithm?: DigestAlgorithm;
  secret?: string;
  form?: Form;
  csrf?: boolean;
  csrfCookie?: CookieOptions;
}

interface AppConfig {
  type?: 'BASIC' | 'DIGEST' | 'SESSION' | 'BEARER';
  options?: Options;
  min?: boolean;
  secured?: boolean;
  fastify?: boolean;
  controllers?: any[];
}

export const admin = ['admin', 'admin'];
export const user = ['user', 'user'];
export const superuser = ['superuser', 'superuser'];
export const REALM = 'TbNestJS Application';

export async function buildApp(context: Context, config: AppConfig) {
  let securityConfig: SecurityConfig;
  const builder = SecurityConfig.builder();
  let authenticationProvider: ProviderOptions;
  if (!config.min) {
    builder
      .httpSecurity()
      .authorize(
        AuthorizeRequests.builder()
          .requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/admin/(.*)')
              .hasRole('ADMIN')
              .hasAuthority('ADMIN_READ')
          )
          .requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/home')
              .hasAnyRoles('ADMIN', 'USER')
          )
          .requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/home')
              .withMethod(RequestMethod.POST)
              .hasAnyAuthorities('POST_HOME')
          )
          .requestMatcher(
            RequestMatcher.builder().requestMatcher('/permit').permitAll()
          )
          .requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/permit')
              .hasAnyRoles('ADMIN', 'USER')
          )
      );
    if (config.options?.csrf) {
      builder.httpSecurity().csrf().enable().cookie(config.options.csrfCookie);
    }
    builder.authenticationBuilder().authenticator(
      Provider.inMemoryAuthenticator()
        .addUser(
          MemoryAuthentication.with(admin[0], admin[1]).withRoles('ADMIN')
        )
        .addUser(MemoryAuthentication.with(user[0], user[1]).withRoles('USER'))
        .addUser(
          MemoryAuthentication.with(superuser[0], superuser[1])
            .withRoles('USER')
            .withAuthorities('ADMIN_READ', 'POST_HOME', 'CREATE')
        )
    );

    switch (config.type) {
      case 'BASIC':
        authenticationProvider =
          Provider.basicAuthentication().charset('utf-8');
        break;
      case 'DIGEST':
        const digestWebAuthenticationProvider = Provider.digestAuthentication();
        if (config.options?.opaque) {
          digestWebAuthenticationProvider.opaque();
        }
        if (config.options?.domain) {
          digestWebAuthenticationProvider.domain(config.options?.domain);
        }
        if (config.options?.qop) {
          digestWebAuthenticationProvider.qop();
        }
        if (config.options?.algorithm) {
          digestWebAuthenticationProvider.algorithm(config.options?.algorithm);
        }
        authenticationProvider = digestWebAuthenticationProvider;
        break;
      case 'BEARER':
        authenticationProvider = Provider.jwtTokenAuthentication(
          config.options.secret
        );
        break;
      case 'SESSION':
        const sessionAuthentication = Provider.sessionAuthentication();
        if (config.options?.form) {
          const form = config.options?.form;
          if (form.pageUrl) {
            sessionAuthentication.formLogin().loginPage(form.pageUrl);
          }
          if (form.loginUrl) {
            sessionAuthentication.formLogin().loginUrl(form.loginUrl);
          }
          if (form.logoutUrl) {
            sessionAuthentication.formLogin().logoutUrl(form.logoutUrl);
          }
          if (form.disableDefault) {
            sessionAuthentication.formLogin().disableDefault();
          }
          if (form.disableLoginService) {
            sessionAuthentication.formLogin().disableLoginService();
          }
        }
        authenticationProvider = sessionAuthentication;
        break;
      default:
        break;
    }
    if (authenticationProvider instanceof WwwOptions) {
      authenticationProvider.realm(REALM);
      if (config.options?.proxy) {
        authenticationProvider.proxy();
      }
    }
    builder
      .authenticationBuilder()
      .authenticationProvider(authenticationProvider);
  }
  const imports: any[] = [TestModule];
  if (config.secured) {
    securityConfig = builder.build();
    imports.push(SecurityModule.forRoot(securityConfig));
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports,
    controllers: config.controllers
  }).compile();
  const application = moduleFixture.createNestApplication(
    config.fastify ? new FastifyAdapter() : undefined
  );

  if (authenticationProvider instanceof SessionOptions) {
    if (config.fastify) {
      await (application as NestFastifyApplication).register(secureSession, {
        secret: 'averylogphrasebiggerthanthirtytwochars',
        salt: 'mq9hDxBVDbspDR6n',
        sessionName: 'session',
        cookieName: 'session.id'
      });
    } else {
      application.use(cookieParser());
      application.use(
        session({
          secret: 'my-secret',
          resave: false,
          saveUninitialized: false,
          name: 'session.id'
        })
      );
    }
  }
  await application.init();
  if (config.fastify) {
    await application.getHttpAdapter().getInstance().ready();
  }

  context.application = application;
  context.securityConfig = securityConfig;
}
