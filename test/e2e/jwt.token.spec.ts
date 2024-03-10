// @ts-ignore
import { Context, doTest } from './core/app.test';
import { buildApp, REALM } from './core/app.config';

describe('Security JWT Authentication Test', () => {
  const context: Context = {
    application: undefined,
    securityConfig: undefined
  };

  const admin =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyLCJjbGFpbXMiOnsicm9sZXMiOlsiQURNSU4iXSwiYXV0aG9yaXRpZXMiOltdfX0.adsyY7KC6yoahPX6e3u2ZAakFHEwOqagezfwgUORTz0';
  const user =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkxIiwibmFtZSI6InVzZXIiLCJpYXQiOjE1MTYyMzkwMjEsImNsYWltcyI6eyJyb2xlcyI6WyJVU0VSIl0sImF1dGhvcml0aWVzIjpbXX19.LGedQNp9BKVU09xORBYJMRmLUpwG1MvtLC3WZvFww_k';
  const superuser =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkyIiwidXNlcm5hbWUiOiJzdXBlcnVzZXIiLCJpYXQiOjE1MTYyMzkwMjAsImNsYWltcyI6eyJyb2xlcyI6WyJVU0VSIl0sImF1dGhvcml0aWVzIjpbIkFETUlOX1JFQUQiXX19.KyfGagtmJzKJ7caJJsX-Cn_s1MdadNf1lWQGd259mCQ';

  beforeEach(async () => {
    await buildApp(context, {
      secured: true,
      type: 'BEARER',
      options: {
        secret: 'test-secret'
      }
    });
  });

  afterEach(async () => {
    await context.application.close();
  });

  doTest(
    context,
    {
      url: '/'
    },
    {
      unauthorized: true,
      headers: {
        ['www-authenticate']: `Bearer realm="${REALM}"`
      }
    },
    'Activation'
  );

  doTest(
    context,
    {
      url: '/',
      headers: {
        Authorization: `Basic token`
      }
    },
    {
      unauthorized: true,
      headers: {
        ['www-authenticate']: `Bearer realm="${REALM}", error="invalid_authorization", error_description="Invalid authorization(Basic token)"`
      }
    },
    'Invalid Basic Token'
  );

  doTest(
    context,
    {
      url: '/',
      headers: {
        Authorization: `Bearer token`
      }
    },
    {
      unauthorized: true,
      headers: {
        ['www-authenticate']: `Bearer realm="${REALM}", error="invalid_token", error_description="jwt malformed"`
      }
    },
    'Invalid Bearer Token'
  );

  doTest(
    context,
    {
      url: '/',
      headers: {
        Authorization: `Bearer ${user}`
      }
    },
    {
      text: 'Welcome Home!'
    },
    'With USER'
  );

  doTest(
    context,
    {
      url: '/admin/dashboard',
      headers: {
        Authorization: `Bearer ${user}`
      }
    },
    {
      forbidden: true
    },
    'With USER'
  );

  doTest(
    context,
    {
      url: '/admin/dashboard',
      headers: {
        Authorization: `Bearer ${admin}`
      }
    },
    {
      text: 'Welcome Dashboard!'
    },
    'With ADMIN'
  );

  doTest(
    context,
    {
      url: '/admin/dashboard',
      headers: {
        Authorization: `Bearer ${superuser}`
      }
    },
    {
      text: 'Welcome Dashboard!'
    },
    'With SUPER USER'
  );
});
