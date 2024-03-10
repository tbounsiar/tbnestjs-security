import { loginTemplate } from '../../src/core/utils/template.utils';
// @ts-ignore
import { Context, doTest } from './core/app.test';
import { buildApp, Form, user } from './core/app.config';
import { createLoginController } from '../../src/controller/login.controller';
import { LoginService } from '../../src/service/login.service';
import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { FormLogin } from '../../src/core/auth/impl/session/form-login';
import { SessionOptions } from '../../src/core/auth/impl/session/session.options';

describe('Session Authentication', () => {
  const context: Context = {
    application: undefined,
    securityConfig: undefined
  };

  function set(
    form?: Form,
    csrf = false,
    fastify = false,
    controllers?: any[]
  ) {
    beforeEach(async () => {
      await buildApp(context, {
        secured: true,
        type: 'SESSION',
        fastify,
        options: {
          form,
          csrf
        },
        controllers
      });
    });

    afterEach(async () => {
      await context.application.close();
    });
  }

  describe('Test FormLogin', () => {
    set();

    doTest(
      context,
      {
        url: '/'
      },
      {
        status: 302,
        headers: {
          location: '/page/login?from=/'
        }
      },
      'Redirect To FormLogin'
    );

    doTest(
      context,
      {
        url: FormLogin.DEFAULT_LOGIN_PAGE
      },
      {
        headers: {
          ['content-type']: 'text/html; charset=utf-8'
        },
        text: loginTemplate(FormLogin.DEFAULT_LOGIN_URL)
      },
      'Default Login Page'
    );

    doTest(
      context,
      {
        url: FormLogin.DEFAULT_LOGIN_URL,
        method: 'post',
        type: 'form',
        send: {
          login: user[0],
          password: user[1]
        }
      },
      {
        status: 302,
        headers: {
          location: '/'
        },
        setCookies: [{ key: 'session.id', reset: true }],
        retest: {
          input: {
            url: '/'
          },
          output: {
            text: 'Welcome Home!'
          }
        }
      },
      'Login Request'
    );
  });

  describe('Csrf Enabling', () => {
    set(undefined, true);

    doTest(
      context,
      {
        url: FormLogin.DEFAULT_LOGIN_URL,
        method: 'post',
        type: 'form',
        send: {
          login: user[0],
          password: user[1]
        }
      },
      {
        status: 302,
        headers: {
          location: '/'
        },
        setCookies: [
          { key: 'session.id', reset: true },
          { key: 'x-csrf-token', reset: true }
        ],
        retest: {
          input: {
            url: '/'
          },
          output: {
            text: 'Welcome Home!'
          }
        }
      },
      'Login Request'
    );
  });

  describe('Csrf Enabling Not Send Token', () => {
    set(undefined, true);

    doTest(
      context,
      {
        url: FormLogin.DEFAULT_LOGIN_URL,
        method: 'post',
        type: 'form',
        send: {
          login: user[0],
          password: user[1]
        }
      },
      {
        status: 302,
        headers: {
          location: '/'
        },
        setCookies: [
          { key: 'session.id', reset: true },
          { key: 'x-csrf-token', reset: false }
        ],
        retest: {
          input: {
            url: '/'
          },
          output: {
            status: 403,
            body: {
              message: 'Forbidden: CSRF token does not match',
              statusCode: 403,
              url: '/'
            }
          }
        }
      },
      'Login Request'
    );
  });

  describe('Csrf Enabling Fastify', () => {
    set(undefined, true, true);

    doTest(
      context,
      {
        url: FormLogin.DEFAULT_LOGIN_URL,
        method: 'post',
        type: 'form',
        send: {
          login: user[0],
          password: user[1]
        }
      },
      {
        status: 302,
        headers: {
          location: '/'
        },
        setCookies: [
          { key: 'session.id', reset: true },
          { key: 'x-csrf-token', reset: true }
        ],
        retest: {
          input: {
            url: '/'
          },
          output: {
            text: 'Welcome Home!'
          }
        }
      },
      'Login Request'
    );
  });

  describe('Test Custom FormLogin url', () => {
    let page = '/the/login/page';
    set({ pageUrl: page });

    doTest(
      context,
      {
        url: FormLogin.DEFAULT_LOGIN_PAGE
      },
      {
        status: 404
      },
      'Default Login Page URL Not Found'
    );

    doTest(
      context,
      {
        url: page
      },
      {},
      'Custom Login Page URL Found'
    );

    doTest(
      context,
      {
        url: '/'
      },
      {
        status: 302,
        headers: {
          location: `${page}?from=/`
        }
      },
      'Should Redirect To Custom Page'
    );
  });

  describe('With Fastify', () => {
    const form: Form = {
      pageUrl: '/the/page',
      loginUrl: '/the/login'
    };

    set(form, false, true);

    doTest(
      context,
      {
        url: '/'
      },
      {
        status: 302,
        headers: {
          location: `${form.pageUrl}?from=/`
        }
      },
      'Should Redirect To Custom Page'
    );

    doTest(
      context,
      {
        url: form.loginUrl,
        method: 'post',
        type: 'form',
        send: {
          login: user[0],
          password: user[1]
        }
      },
      {
        status: 302,
        headers: {
          location: '/'
        },
        setCookies: [{ key: 'session.id', reset: true }],
        retest: {
          input: {
            url: '/'
          },
          output: {
            text: 'Welcome Home!'
          }
        }
      },
      'Login Request'
    );
  });

  describe('Disable defaults', () => {
    const form: Form = {
      pageUrl: '/the/page',
      loginUrl: '/the/login',
      disableDefault: true,
      disableLoginService: true
    };

    function init(context: Context) {
      const formLogin = (
        context.securityConfig
          .authenticationBuilder()
          .authenticationProvider() as SessionOptions
      ).formLogin();
      context.data = {
        LoginController: createLoginController(formLogin)
      };
    }

    set(form, false, true);

    doTest(
      context,
      {
        url: form.pageUrl
      },
      {
        status: 404,
        check: () => {
          const controller = () => {
            try {
              context.application.get(context.data.LoginController);
            } catch (error) {
              throw new Error('Nest could not find LoginController element');
            }
          };
          const service = () => {
            try {
              context.application.get(LoginService);
            } catch (error) {
              throw new Error('Nest could not find LoginService element');
            }
          };

          expect(() => controller()).toThrow(
            'Nest could not find LoginController element'
          );
          expect(() => service()).toThrow(
            'Nest could not find LoginService element'
          );
        }
      },
      'Default Login Page And Service',
      init
    );
  });

  describe('Set Custom Login', () => {
    const form: Form = {
      pageUrl: '/the/page',
      loginUrl: '/the/login',
      logoutUrl: '/the/logout',
      disableDefault: true,
      disableLoginService: true
    };

    const loginService = {
      page: jest.fn(),
      login: jest.fn(),
      logout: jest.fn()
    };

    const CustomLoginController = (() => {
      @Controller()
      class LoginController {
        @Get(form.pageUrl)
        page() {
          loginService.page();
        }

        @Post(form.loginUrl)
        @HttpCode(200)
        login() {
          loginService.login();
        }

        @Post(form.logoutUrl)
        @HttpCode(200)
        logout() {
          loginService.logout();
        }
      }

      return LoginController;
    })();

    set(form, false, true, [CustomLoginController]);

    doTest(
      context,
      {
        url: form.pageUrl
      },
      {
        check: (context) => {
          const controller = context.application.get(CustomLoginController);
          expect(controller).toBeTruthy();
          expect(loginService.page).toHaveBeenCalled();
        }
      },
      'Default Login Page'
    );

    doTest(
      context,
      {
        url: form.loginUrl,
        method: 'post'
      },
      {
        check: (context) => {
          const controller = context.application.get(CustomLoginController);
          expect(controller).toBeTruthy();
          expect(loginService.login).toHaveBeenCalled();
        }
      },
      'Default Login URL'
    );

    doTest(
      context,
      {
        url: form.logoutUrl,
        method: 'post'
      },
      {
        check: (context) => {
          const controller = context.application.get(CustomLoginController);
          expect(controller).toBeTruthy();
          expect(loginService.logout).toHaveBeenCalled();
        }
      },
      'Default Logout URL'
    );
  });
});
