import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthorizeRequests, RequestMatcher, SecurityConfig, SecurityModule } from '../src';
// @ts-ignore
import { TestModule } from './core/test.module';

describe('Security JWT Authentication Test', () => {

  let app: INestApplication;
  let securityConfig: SecurityConfig;
  const admin = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJjbGFpbXMiOnsicm9sZXMiOlsiQURNSU4iXSwiYXV0aG9yaXRpZXMiOltdfX0.adsyY7KC6yoahPX6e3u2ZAakFHEwOqagezfwgUORTz0';
  const user = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkxIiwibmFtZSI6InVzZXIiLCJpYXQiOjE1MTYyMzkwMjEsImNsYWltcyI6eyJyb2xlcyI6WyJVU0VSIl0sImF1dGhvcml0aWVzIjpbXX19.LGedQNp9BKVU09xORBYJMRmLUpwG1MvtLC3WZvFww_k';
  const superuser = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkyIiwidXNlcm5hbWUiOiJzdXBlcnVzZXIiLCJpYXQiOjE1MTYyMzkwMjAsImNsYWltcyI6eyJyb2xlcyI6WyJVU0VSIl0sImF1dGhvcml0aWVzIjpbIkFETUlOX1JFQUQiXX19.KyfGagtmJzKJ7caJJsX-Cn_s1MdadNf1lWQGd259mCQ';


  beforeEach(async () => {

    const builder = SecurityConfig.builder();

    const jwtTokenAuthentication = builder
      .provide()
      .jwtTokenAuthentication('test-secret')
      .realm('Jwt Authentication Test');

    builder.httpSecurity()
      .authorize(
        AuthorizeRequests.builder().requestMatcher(
          RequestMatcher.builder()
            .requestMatcher('/admin/(.*)')
            .hasRole('ADMIN')
            .hasAuthority('ADMIN_READ'),
        )).and()
      .authenticationBuilder()
      .authenticationProvider(
        jwtTokenAuthentication,
      );

    securityConfig = builder.build();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule, SecurityModule.forRoot(securityConfig)],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  test('Ask For Authentication', done => {
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
          'Bearer realm="Jwt Authentication Test"',
        );
        done();
      });
  });

  test('Ask For Authentication (Invalid Basic Token)', done => {
    request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Basic token`)
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
          'Bearer realm="Jwt Authentication Test", error="invalid_authorization", error_description="Invalid authorization(Basic token)"',
        );
        done();
      });
  });

  test('Ask For Authentication (Invalid Bearer Token)', done => {
    request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Bearer token`)
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
          'Bearer realm="Jwt Authentication Test", error="invalid_token", error_description="jwt malformed"',
        );
        done();
      });
  });

  test('GET(/) With USER', () => {
    return request(app.getHttpServer())
      .get('/')
      .set('Authorization', `Bearer ${user}`)
      .expect(200)
      .expect('Welcome Home!');
  });

  test('GET(/admin/dashboard) With USER', (done) => {
    request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${user}`)
      .end((error, response) => {
        if (error) {
          done(error);
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

  test('GET(/admin/dashboard) With ADMIN', () => {
    return request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200)
      .expect('Welcome Dashboard!');
  });

  test('GET(/admin/dashboard) With SUPERUSER', () => {
    return request(app.getHttpServer())
      .get('/admin/dashboard')
      .set('Authorization', `Bearer ${superuser}`)
      .expect(200)
      .expect('Welcome Dashboard!');
  });
});
