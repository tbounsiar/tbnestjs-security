import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import * as utils from '../src/core/utils/utils';
import { md5 } from '../src/core/utils/crypto-utils';
import { AuthorizeRequests, MemoryAuthentication, RequestMatcher, SecurityConfig, SecurityModule } from '../src';
// @ts-ignore
import { TestModule } from './core/test.module';
import { DigestAlgorithm } from '../src';

describe('Security Digest Authentication Test', () => {

  let app: INestApplication;
  const builder = SecurityConfig.builder();
  const admin = ['admin', 'admin'];
  const user = ['user', 'user'];
  const superuser = ['superuser', 'superuser'];
  const id = '1234567890';
  // @ts-ignore
  utils.generate = (length: number) => {
    return id;
  };

  function before(
    option?: {
      proxy?: boolean,
      qop?: string,
      opaque?: boolean,
      domain?: string,
      algorithm?: DigestAlgorithm
    }) {

    beforeEach(async () => {


      builder
        .authenticationBuilder()
        .authenticator(
          builder
            .provide()
            .inMemoryAuthenticator()
            .addUser(
              MemoryAuthentication.with(admin[0], admin[1])
                .withRoles('ADMIN'),
            )
            .addUser(
              MemoryAuthentication.with(user[0], user[1])
                .withRoles('USER'),
            )
            .addUser(
              MemoryAuthentication.with(superuser[0], superuser[1])
                .withRoles('USER')
                .withAuthorities('POST_HOME'),
            ),
        );
      const digestAuthentication = builder
        .provide()
        .digestAuthentication()
        .realm('Digest Authentication Test');
      if (option?.proxy) {
        digestAuthentication.proxy();
      }
      if (option?.opaque) {
        digestAuthentication.opaque();
      }
      if (option?.domain) {
        digestAuthentication.domain(option?.domain);
      }
      if (option?.qop) {
        digestAuthentication.qop();
      }
      if (option?.algorithm) {
        digestAuthentication.algorithm(option?.algorithm);
      }
      builder.authenticationBuilder()
        .authenticationProvider(
          digestAuthentication,
        ).and()
        .httpSecurity()
        .authorize(
          AuthorizeRequests.builder().requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/admin/(.*)')
              .hasAnyRoles('ADMIN'),
          ),
        );

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule, SecurityModule.forRoot(builder.build())],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });
  }

  function authHeader(options?: {
    proxy?: boolean,
    qop?: string,
    opaque?: boolean,
    domain?: string,
    algorithm?: DigestAlgorithm
  }) {

    const header = [
      `Digest realm="Digest Authentication Test"`,
    ];

    if (options?.domain) {
      header.push(`domain="${options.domain}"`);
    }
    header.push(`nonce="e807f1fcf82d132f9bb018ca6738a19f"`);

    if (options?.opaque) {
      header.push(`opaque="e807f1fcf82d132f9bb018ca6738a19f"`);
    }

    if (options?.algorithm) {
      header.push(`algorithm="${options.algorithm}"`);
    }

    if (options?.qop) {
      header.push(`qop="${options.qop}"`);
    }

    return header.join(', ');
  }

  async function activation(options?: {
    proxy?: boolean,
    qop?: string,
    opaque?: boolean,
    domain?: string,
    algorithm?: DigestAlgorithm
  }) {

    const unauthorizedResponse = {
      message: 'Unauthorized',
      statusCode: 401,
      url: '/',
    };
    const headerKey = (options?.proxy ? 'proxy' : 'www') + '-authenticate';
    const headerValue = authHeader(options);
    const description = `When GET(/) Without User Auth${options ? ` And Digest Options(${JSON.stringify(options)})` : ''}
        Expect Response Header['${headerKey}'] To Be (${headerValue})
        Expect Response Status To Be (UNAUTHORIZED)
        Expect Response Body To Be (${JSON.stringify(unauthorizedResponse)})`;

    describe(description, () => {

      before(options);
      test(`Test`, (done) => {
        request(app.getHttpServer())
          .get('/')
          .end((error, response) => {
            if (error) {
              return done(error);
            }
            expect(response.unauthorized);
            expect(response.body).toEqual(unauthorizedResponse);
            expect(response.headers[headerKey]).toBe(headerValue);
            done();
          });
      });
    });
  }

  activation();
  activation({ proxy: true });
  activation({
    qop: 'auth',
    opaque: true,
    domain: 'localhost',
    algorithm: 'MD5-sess' as DigestAlgorithm,
  });

  async function authentication(
    user: string[],
    uri: string,
    forbidden: boolean,
    body?: string,
    options?: {
      proxy?: boolean,
      qop?: string,
      opaque?: boolean,
      domain?: string,
      algorithm?: DigestAlgorithm
    },
    method = 'get',
  ) {

    const forbiddenResponse = {
      message: 'Forbidden',
      statusCode: 403,
      url: uri,
    };

    const description = `When ${method.toUpperCase()}(${uri}) Using User(${user[0]}:${user[1]})${
      options ? ` And Digest Options(${JSON.stringify(options)})` : ''
    }
        Expect Response Status To Be (${forbidden ? 'OK' : 'FORBIDDEN'})
        Expect Response Body To Be (${forbidden ? JSON.stringify(forbiddenResponse) : body})`;

    describe(description, () => {

      before(options);
      test(`Test`, (done) => {

        const authorization = createDigestAuthorization({
          username: user[0],
          password: user[1],
          method: method.toUpperCase(),
          uri,
          realm: 'Digest Authentication Test',
          nonce: 'e807f1fcf82d132f9bb018ca6738a19f',
          nc: '00000002',
          opaque: 'e807f1fcf82d132f9bb018ca6738a19f',
          cnonce: 'b9721bf15eda3852',
          algorithm: options.algorithm,
          qop: options.qop,
        });
        const req = request(app.getHttpServer());
        req[method](uri)
          .end((error, response) => {
            if (error) {
              return done(error);
            }
            expect(response.unauthorized);
            expect(response.body).toEqual({
              message: 'Unauthorized',
              statusCode: 401,
              url: uri,
            });
            expect(response.headers['www-authenticate']).toBe(
              authHeader(options),
            );
            req[method](uri)
              .set(
                'Authorization',
                authorization,
              ).end((err, res) => {
              if (err) {
                return done(err);
              }
              if (forbidden) {
                expect(res.forbidden);
                expect(res.body).toEqual(forbiddenResponse);
              } else {
                expect(res.ok);
                expect(res.text).toEqual(body);
              }
              done();
            });
          });
      });
    });
  }

  authentication(
    user,
    '/',
    false,
    'Welcome Home!',
    {
      qop: 'auth',
      opaque: true,
      domain: 'localhost',
      algorithm: 'MD5-sess' as DigestAlgorithm,
    },
  );

  authentication(
    user,
    '/admin/dashboard',
    true,
    undefined,
    {
      qop: 'auth',
      opaque: true,
      domain: 'localhost',
      algorithm: 'MD5-sess' as DigestAlgorithm,
    },
  );

  authentication(
    admin,
    '/admin/dashboard',
    false,
    'Welcome Dashboard!',
    {
      qop: 'auth',
      opaque: true,
      domain: 'localhost',
      algorithm: 'MD5-sess' as DigestAlgorithm,
    },
  );
});

function createDigestAuthorization(option: {
  username: string,
  password: string,
  method: string,
  uri: string,
  body?: string
  realm: string,
  nonce: string,
  nc: string,
  opaque: string,
  cnonce: string,
  qop?: string,
  algorithm: DigestAlgorithm
}) {
  let ha1 = md5(`${option.username}:${option.realm}:${option.password}`);
  if (option.algorithm === 'MD5-sess') {
    ha1 = md5(`${ha1}:${option.nonce}:${option.cnonce}`);
  }
  const ha2 = md5(`${option.method}:${option.uri}`);
  const response = option.qop ?
    md5(
      `${ha1}:${option.nonce}:${option.nc}:${option.cnonce}:${option.qop}:${ha2}`,
    ) :
    md5(`${ha1}:${option.nonce}:${ha2}`);

  return `Digest username="${option.username}", realm="${option.realm}", nonce="${option.nonce}", uri="${option.uri}", algorithm=${option.algorithm}, qop=${option.qop}, nc=${option.nc}, cnonce="${option.cnonce}", response="${response}", opaque="${option.opaque}"`;
}
