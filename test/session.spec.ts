import { INestApplication } from '@nestjs/common';
import { AuthorizeRequests, MemoryAuthentication, RequestMatcher, SecurityConfig, SecurityModule } from '../src';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import * as session from 'express-session';
import * as secureSession from '@fastify/secure-session';
import { loginTemplate } from '../src/core/utils/template';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { FormLogin } from '../src/core/auth/impl/sessionAuthenticationProvider';
// @ts-ignore
import { TestModule } from './core/test.module';

describe('Security Session Authentication Test', () => {

  let app: INestApplication;
  const builder = SecurityConfig.builder();
  const admin = ['admin', 'admin'];
  const user = ['user', 'user'];
  const superuser = ['superuser', 'superuser'];

  function before(form?: { page: string, disableDefault?: boolean, disableLoginService?: boolean }, fastify = false) {

    beforeEach(async () => {
      builder
        .httpSecurity()
        .authorize(
          AuthorizeRequests.builder().requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/admin/(.*)')
              .hasAnyRoles('ADMIN'),
          ),
        );

      const sessionAuthentication = builder
        .provide()
        .sessionAuthentication();
      if (form) {
        sessionAuthentication.formLogin(
          FormLogin.new()
            .loginPage(form.page),
        );
        if (form.disableDefault) {
          sessionAuthentication.formLogin().disableDefault();
        }
        if (form.disableLoginService) {
          sessionAuthentication.formLogin().disableLoginService();
        }
      }

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
                .withAuthorities('CREATE'),
            ),
        )
        .authenticationProvider(
          sessionAuthentication,
        );

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule, SecurityModule.forRoot(builder.build())],
      }).compile();

      if (fastify) {
        app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await (app as NestFastifyApplication).register(secureSession, {
          secret: 'averylogphrasebiggerthanthirtytwochars',
          salt: 'mq9hDxBVDbspDR6n',
          sessionName: 'session',
          cookieName: 'session.id',
        });
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
      } else {
        app = moduleFixture.createNestApplication();
        app.use(
          session({
            secret: 'my-secret',
            resave: false,
            saveUninitialized: false,
            name: 'session.id',
          }),
        );
        await app.init();
      }
    });

    if (fastify) {
      afterEach(async () => {
        await app.close();
      });
    }
  }

  describe('Test FormLogin', () => {

    before();

    test('Should Redirect To FormLogin', (done) => {
      request(app.getHttpServer())
        .get('/')
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.redirect);
          expect(response.header.location).toEqual('/page/login?from=/');
          done();
        });
    });

    test('Test GET Default Login Page', (done) => {
      request(app.getHttpServer())
        .get(FormLogin.DEFAULT_LOGIN_PAGE)
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.ok);
          expect(response.headers['content-type']).toEqual('text/html; charset=utf-8');
          expect(response.text).toEqual(loginTemplate(FormLogin.DEFAULT_LOGIN_URL));
          done();
        });
    });

    test('Test Login Request', (done) => {
      const req = request(app.getHttpServer());
      req
        .post(FormLogin.DEFAULT_LOGIN_URL)
        .type('form')
        .send({
          login: user[0],
          password: user[1],
        })
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.redirect);
          expect(response.header.location).toEqual('/');
          const cookie = response.get('Set-Cookie').find(c => c.startsWith('session.id='));
          expect(cookie).toBeTruthy();
          req.get('/')
            .set('Cookie', [cookie])
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.ok);
              expect(res.text).toEqual('Welcome Home!');
              done();
            });
        });
    });
  });

  describe('Test Custom FormLogin url', () => {

    let page = '/the/login/page';
    before({ page });

    test('Default Login Page URL Not FOUND', (done) => {
      request(app.getHttpServer())
        .get(FormLogin.DEFAULT_LOGIN_PAGE)
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.notFound);
          done();
        });
    });

    test('Custom Login Page URL Found', (done) => {
      request(app.getHttpServer())
        .get(page)
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.ok);
          done();
        });
    });

    test('Should Redirect To Page', (done) => {
      request(app.getHttpServer())
        .get('/')
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.redirect);
          expect(response.header.location).toEqual(`${page}?from=/`);
          done();
        });
    });
  });

  describe('With Fastify', () => {

    before(undefined, true);

    test('Test Login Request', (done) => {
      const req = request(app.getHttpServer());
      req
        .post(FormLogin.DEFAULT_LOGIN_URL)
        .type('form')
        .send({
          login: user[0],
          password: user[1],
        })
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.redirect);
          expect(response.header.location).toEqual('/');
          const cookie = response.get('Set-Cookie').find(c => c.startsWith('session.id='));
          expect(cookie).toBeTruthy();
          req.get('/')
            .set('Cookie', [cookie])
            .end((err, res) => {
              if (err) {
                return done(err);
              }
              expect(res.ok);
              expect(res.text).toEqual('Welcome Home!');
              done();
            });
        });
    });
  });
});
