import {
  sessionAndFormMessage,
  SessionAuthenticationProvider
} from '../../src/core/auth/impl/session/session.authentication.provider';
import { SessionOptions } from '../../src/core/auth/impl/session/session.options';
import { FormLogin } from '../../src/core/auth/impl/session/form-login';

describe('SessionAuthenticationProvider Test', () => {
  const options = new SessionOptions();

  test('No Session Configuration', (done) => {
    const authenticationProvider = new SessionAuthenticationProvider();
    const request = {};
    expect(() =>
      authenticationProvider.setAuthentication(request, null, null)
    ).toThrow(sessionAndFormMessage);

    authenticationProvider.getAuthentication(request).catch((reason) => {
      expect(reason.message).toBe(sessionAndFormMessage);
      done();
    });
  });

  test('Session Logout', () => {
    const authenticationProvider = new SessionAuthenticationProvider();
    const request = { session: { authentication: null } };
    authenticationProvider.setAuthentication(request, null, null);
    expect(request.session.authentication).toBeUndefined();
  });

  test('FormLogin Set', () => {
    const formLogin = FormLogin.new()
      .loginPage('page')
      .loginUrl('login')
      .logoutUrl('logout')
      .redirectUrl('redirect');
    expect(formLogin.loginPage()).toBe('page');
    expect(formLogin.loginUrl()).toBe('login');
    expect(formLogin.logoutUrl()).toBe('logout');
    expect(formLogin.redirectUrl()).toBe('redirect');
  });
});
