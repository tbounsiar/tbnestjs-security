import { DigestAlgorithm } from '../src';
// @ts-ignore
import { Context, createDigestAuthorization, createDigetAuthenticationHeader, doTest, Method } from './core/app.test';
import { admin, buildApp, Options, REALM, user } from './core/app.config';
import { AuthenticateType } from '../src/core/auth/abstract/authenticationProvider';
import * as crypto from 'crypto';

describe('Digest Authentication', () => {

  const context: Context = {
    application: undefined,
    securityConfig: undefined,
  };

  // @ts-ignore
  crypto.randomBytes = (length: number) => {
    return Buffer.from('1234567890');
  };

  function set(options?: Options) {

    beforeEach(async () => {
      await buildApp(context, {
        secured: true,
        type: AuthenticateType.DIGEST,
        options,
      });
    });

    afterEach(async () => {
      await context.application.close();
    });
  }

  async function activation(options?: Options) {

    const description = `Activate With Options(${JSON.stringify(options)})`;
    describe(description, () => {
      set(options);
      doTest(context, {
        url: '/',
      }, {
        unauthorized: true,
        headers: {
          [(options?.proxy ? 'proxy' : 'www') + '-authenticate']: createDigetAuthenticationHeader(options),
        },
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
    url: string,
    forbidden: boolean,
    body?: string,
    options?: Options,
    method: Method = 'get',
  ) {

    const description = `Authentication Using User (${user[0]}:${user[1]})${
      options ? ` And Digest Options(${JSON.stringify(options)})` : ''
    }`;

    describe(description, () => {

      set(options);

      const authorization = createDigestAuthorization({
        username: user[0],
        password: user[1],
        method: method.toUpperCase(),
        uri: url,
        realm: REALM,
        nonce: 'e807f1fcf82d132f9bb018ca6738a19f',
        nc: '00000002',
        opaque: 'e807f1fcf82d132f9bb018ca6738a19f',
        cnonce: 'b9721bf15eda3852',
        algorithm: options.algorithm,
        qop: options.qop,
      });

      doTest(context, {
        url,
        method,
      }, {
        unauthorized: true,
        headers: {
          ['www-authenticate']: createDigetAuthenticationHeader(options),
        },
        retest: {
          input: {
            url,
            method,
            headers: {
              'Authorization': authorization,
            },
          },
          output: {
            forbidden,
            text: body,
          },
        },
      });

      // test(`Test`, (done) => {
      //   const req = request(app.getHttpServer());
      //   req[method](url)
      //     .end((error, response) => {
      //       if (error) {
      //         return done(error);
      //       }
      //       expect(response.unauthorized);
      //       expect(response.body).toEqual({
      //         message: 'Unauthorized',
      //         statusCode: 401,
      //         url: url,
      //       });
      //       expect(response.headers['www-authenticate']).toBe(
      //         createDigetAuthenticationHeader(options),
      //       );
      //       req[method](url)
      //         .set(
      //           'Authorization',
      //           authorization,
      //         ).end((err, res) => {
      //         if (err) {
      //           return done(err);
      //         }
      //         if (forbidden) {
      //           expect(res.forbidden);
      //           expect(res.body).toEqual(forbiddenResponse);
      //         } else {
      //           expect(res.ok);
      //           expect(res.text).toEqual(body);
      //         }
      //         done();
      //       });
      //     });
      // });
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
