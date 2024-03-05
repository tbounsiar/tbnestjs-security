import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, RequestMethod } from '@nestjs/common';
import * as request from 'supertest';
import { base64Encode } from '../src/core/utils/crypto-utils';
import {
  AuthorizeRequests,
  MemoryAuthentication,
  RequestAuthentication,
  RequestMatcher,
  SecurityConfig,
  SecurityModule,
} from '../src';
// @ts-ignore
import { TestModule } from './core/test.module';

describe('Security Basic Authentication Test', () => {

  let app: INestApplication;
  let securityConfig: SecurityConfig;
  const admin = ['admin', 'admin'];
  const user = ['user', 'user'];
  const superuser = ['superuser', 'superuser'];

  function before(proxy: boolean = false) {

    beforeEach(async () => {

      const builder = SecurityConfig.builder();

      const basicAuthentication = builder
        .provide()
        .basicAuthentication()
        .realm('Basic Authentication Test')
        .charset('utf-8');
      if (proxy) {
        basicAuthentication.proxy();
      }
      builder
        .httpSecurity()
        .authorize(
          AuthorizeRequests.builder().requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/admin/(.*)')
              .hasRole('ADMIN')
              .hasAuthority('ADMIN_READ'),
          ).requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/home')
              .hasAnyRoles('ADMIN', 'USER'),
          ).requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/home')
              .withMethod(RequestMethod.POST)
              .hasAnyAuthorities('POST_HOME'),
          ).requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/permit')
              .permitAll(),
          ).requestMatcher(
            RequestMatcher.builder()
              .requestMatcher('/permit')
              .hasRole('ADMIN')
          ),
        ).and()
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
                .withAuthorities('ADMIN_READ', 'POST_HOME', 'CREATE'),
            ),
        )
        .authenticationProvider(
          basicAuthentication,
        );

      securityConfig = builder.build();

      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [TestModule, SecurityModule.forRoot(securityConfig)],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });
  }

  describe('Without Proxy', () => {

    before();

    test('Test Basic Authentication Activation', (done) => {
      request(app.getHttpServer())
        .get('/')
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.unauthorized);
          expect(response.body).toEqual({
            message: 'Unauthorized',
            statusCode: 401,
            url: '/',
          });
          expect(response.headers['www-authenticate']).toBe(
            'Basic realm="Basic Authentication Test", charset="utf-8"',
          );
          done();
        });
    });

    test('Test GET(/permit) Without Authentication ', () => {
      return request(app.getHttpServer())
        .get('/permit')
        .expect(200)
        .expect('Welcome Permit!');
    });

    test('Test Basic Authentication GET(/)', () => {
      return request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Basic ${base64Encode(user.join(':'))}`)
        .expect(200)
        .expect('Welcome Home!');
    });

    test('GET(/home) WITH USER OK', () => {
      return request(app.getHttpServer())
        .get('/home')
        .set('Authorization', `Basic ${base64Encode(user.join(':'))}`)
        .expect(200)
        .expect('Welcome Home!');
    });


    test('POST(/home) WITH USER FORBIDDEN', () => {
      return request(app.getHttpServer())
        .post('/home')
        .set('Authorization', `Basic ${base64Encode(user.join(':'))}`)
        .expect(403)
        .expect({
          message: 'Forbidden',
          statusCode: 403,
          url: '/home',
        });
    });

    test('POST(/home) With SUPERUSER OK', () => {
      return request(app.getHttpServer())
        .post('/home')
        .set('Authorization', `Basic ${base64Encode(superuser.join(':'))}`)
        .expect(200)
        .expect('Welcome Home!');
    });

    test('Test Basic Authentication / (GET) Without Base 64 Encode', (done) => {
      request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Basic ${user.join(':')}`)
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.unauthorized);
          expect(response.body).toEqual({
            message: 'Unauthorized',
            statusCode: 401,
            url: '/',
          });
          expect(response.headers['www-authenticate']).toBe(
            'Basic realm="Basic Authentication Test", charset="utf-8"',
          );
          done();
        });
    });

    test('Test Basic Authentication GET(/) Without Non Valid Authorization', (done) => {
      request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Digest ${user.join(':')}`)
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.unauthorized);
          expect(response.body).toEqual({
            message: 'Unauthorized',
            statusCode: 401,
            url: '/',
          });
          expect(response.headers['www-authenticate']).toBe(
            'Basic realm="Basic Authentication Test", charset="utf-8"',
          );
          done();
        });
    });

    test('Test Basic Authentication (GET) /admin/dashboard Without (ADMIN) Role', (done) => {
      request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Basic ${base64Encode(user.join(':'))}`)
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.forbidden);
          expect(response.body).toEqual({
            message: 'Forbidden',
            statusCode: 403,
            url: '/admin/dashboard',
          });
          done();
        });
    });

    test('Test Basic Authentication (GET) /admin/dashboard With (ADMIN) Role', () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Basic ${base64Encode(admin.join(':'))}`)
        .expect(200)
        .expect('Welcome Dashboard!');
    });

    test('Test Basic Authentication (GET) /admin/dashboard With (ADMIN_READ) Authority', () => {
      return request(app.getHttpServer())
        .get('/admin/dashboard')
        .set('Authorization', `Basic ${base64Encode(superuser.join(':'))}`)
        .expect(200)
        .expect('Welcome Dashboard!');
    });

    test('Test POST(/create) With User', () => {
      return request(app.getHttpServer())
        .post('/create')
        .set('Authorization', `Basic ${base64Encode(user.join(':'))}`)
        .expect(403)
        .expect({
          message: 'Forbidden',
          statusCode: 403,
          url: '/create',
        });
    });

    test('Test POST(/create) With SuperUser', () => {
      return request(app.getHttpServer())
        .post('/create')
        .set('Authorization', `Basic ${base64Encode(superuser.join(':'))}`)
        .expect(200)
        .expect('You Can Create!');
    });

    test('Test GET(/admin/list/1) With ADMIN Role AND Organization 1', (done) => {
      const requestAuthentication = {
        hasRole: jest.fn(() => true),
        isRequestValid: jest.fn(() => true),
        hasOrganization: jest.fn(() => true),
        isAuthenticated: jest.fn(() => true),
      };

      securityConfig.authenticationBuilder().authenticationProvider().getAuthentication = jest.fn(() => requestAuthentication as unknown as RequestAuthentication);
      request(app.getHttpServer())
        .get('/admin/list/1')
        .set('Authorization', `Basic ${base64Encode(superuser.join(':'))}`)
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(requestAuthentication.isRequestValid).toHaveBeenCalledTimes(1);
          expect(requestAuthentication.hasRole).toHaveBeenCalledWith('ADMIN');
          expect(requestAuthentication.hasOrganization).toHaveBeenCalledWith('1');
          expect(response.ok);
          expect(response.text).toEqual('List for 1');
          done();
        });
    });
  });

  describe('With Proxy', () => {

    before(true);

    test('Test Basic Authentication Proxy Activation', done => {
      request(app.getHttpServer())
        .get('/')
        .end((error, response) => {
          if (error) {
            return done(error);
          }
          expect(response.unauthorized);
          expect(response.body).toEqual({
            message: 'Unauthorized',
            statusCode: 401,
            url: '/',
          });
          expect(response.headers['proxy-authenticate']).toBe(
            'Basic realm="Basic Authentication Test", charset="utf-8"',
          );
          done();
        });
    });
  });
});
