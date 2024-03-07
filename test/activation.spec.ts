// @ts-ignore
import { buildApp } from './core/app.config';
import { Context, doTest, Input } from './core/app.test';

describe('Security Activated', () => {

  const context: Context = {
    application: undefined,
    securityConfig: undefined,
  };
  const inputs: Input[] = [
    { url: '/' },
    { url: '/permit' },
    { url: '/home' },
    { url: '/create', method: 'post' },
    { url: '/admin/dashboard' },
    { url: '/admin/list/2' },
  ];

  function set(secured: boolean = false, fastify: boolean = false) {

    beforeEach(async () => {
      await buildApp(context, { min: true, secured, fastify });
    });

    afterEach(async () => {
      await context.application.close();
    });
  }

  describe('Activated  -> All routes are secured', () => {

    set(true);

    inputs.forEach(input => {
      doTest(context, input, {
        unauthorized: true,
      });
    });
  });

  describe('Activated With Fastify Adapter  -> All routes are secured', () => {

    set(true, true);

    inputs.forEach(input => {
      doTest(context, input, {
        unauthorized: true,
      });
    });
  });

  describe('Not Activated', () => {
    set();
    inputs.forEach(input => {
      doTest(context, input, {
        status: 200,
      });
    });
  });
});