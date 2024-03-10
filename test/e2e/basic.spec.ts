import { base64Encode } from '../../src/core/utils/crypto.utils';
import {
  BasicWebAuthenticationProvider,
  DigestWebAuthenticationProvider,
  RequestAuthentication
} from '../../src';
// @ts-ignore
import { admin, buildApp, REALM, superuser, user } from './core/app.config';
import { Context, doTest } from './core/app.test';

describe('Basic Authentication', () => {
  const context: Context = {
    application: undefined,
    securityConfig: undefined
  };

  function set(proxy: boolean = false) {
    beforeEach(async () => {
      await buildApp(context, {
        secured: true,
        type: 'BASIC',
        options: {
          proxy
        }
      });
    });

    afterEach(async () => {
      await context.application.close();
      jest.restoreAllMocks();
    });
  }

  describe('Without Proxy', () => {
    set();

    describe('Authentication Activation', () => {
      doTest(
        context,
        {
          url: '/'
        },
        {
          unauthorized: true,
          headers: {
            'www-authenticate': `Basic realm="${REALM}", charset="utf-8"`
          }
        }
      );
    });

    describe('Without Authentication', () => {
      doTest(
        context,
        {
          url: '/permit'
        },
        {
          text: 'Welcome Permit!'
        }
      );
    });

    describe('With USER', () => {
      doTest(
        context,
        {
          url: '/',
          headers: {
            Authorization: `Basic ${base64Encode(user.join(':'))}`
          }
        },
        {
          text: 'Welcome Home!'
        }
      );

      doTest(
        context,
        {
          url: '/home',
          headers: {
            Authorization: `Basic ${base64Encode(user.join(':'))}`
          }
        },
        {
          text: 'Welcome Home!'
        }
      );

      doTest(
        context,
        {
          url: '/home',
          method: 'post',
          headers: {
            Authorization: `Basic ${base64Encode(user.join(':'))}`
          }
        },
        {
          forbidden: true
        }
      );
    });

    describe('With SUPER USER', () => {
      doTest(
        context,
        {
          url: '/home',
          method: 'post',
          headers: {
            Authorization: `Basic ${base64Encode(superuser.join(':'))}`
          }
        },
        {
          text: 'Welcome Home!'
        }
      );
    });

    describe('Without USER BASE 64 Encode', () => {
      doTest(
        context,
        {
          url: '/',
          headers: {
            Authorization: `Basic ${user.join(':')}`
          }
        },
        {
          unauthorized: true,
          headers: {
            'www-authenticate': `Basic realm="${REALM}", charset="utf-8"`
          }
        }
      );
    });

    doTest(
      context,
      {
        url: '/admin/dashboard',
        headers: {
          Authorization: `Basic ${base64Encode(user.join(':'))}`
        }
      },
      {
        forbidden: true
      },
      'Without (ADMIN) Role'
    );

    doTest(
      context,
      {
        url: '/admin/dashboard',
        headers: {
          Authorization: `Basic ${base64Encode(admin.join(':'))}`
        }
      },
      {
        text: 'Welcome Dashboard!'
      },
      'Without (ADMIN) Role'
    );

    doTest(
      context,
      {
        url: '/admin/dashboard',
        headers: {
          Authorization: `Basic ${base64Encode(superuser.join(':'))}`
        }
      },
      {
        text: 'Welcome Dashboard!'
      },
      'With (ADMIN_READ) Authority'
    );

    doTest(
      context,
      {
        url: '/create',
        method: 'post',
        headers: {
          Authorization: `Basic ${base64Encode(user.join(':'))}`
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
        url: '/create',
        method: 'post',
        headers: {
          Authorization: `Basic ${base64Encode(superuser.join(':'))}`
        }
      },
      {
        text: 'You Can Create!'
      },
      'With SUPER USER'
    );
  });

  describe('With SUPER USER AND Organization 1', () => {
    set();

    const requestAuthentication = {
      hasRole: jest.fn(() => true),
      isRequestValid: jest.fn(() => true),
      hasOrganization: jest.fn(() => true),
      isAuthenticated: jest.fn(() => true)
    };

    function init(context: Context) {
      // @ts-ignore
      jest
        .spyOn(BasicWebAuthenticationProvider.prototype, 'getAuthentication')
        .mockImplementationOnce(() =>
          Promise.resolve(
            requestAuthentication as unknown as RequestAuthentication
          )
        );
    }

    doTest(
      context,
      {
        url: '/admin/list/1',
        headers: {
          Authorization: `Basic ${base64Encode(superuser.join(':'))}`
        }
      },
      {
        text: 'List for 1',
        calls: [
          {
            function: requestAuthentication.isRequestValid,
            times: 1
          },
          {
            function: requestAuthentication.hasRole,
            with: 'ADMIN'
          },
          {
            function: requestAuthentication.hasOrganization,
            with: '1'
          }
        ]
      },
      'With SUPER USER',
      init
    );
  });

  describe('With Proxy', () => {
    set(true);

    doTest(
      context,
      {
        url: '/'
      },
      {
        unauthorized: true,
        headers: {
          'proxy-authenticate': `Basic realm="${REALM}", charset="utf-8"`
        }
      },
      'Authentication Activation'
    );
  });
});
