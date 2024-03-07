import { FormLogin, sessionAndFormMessage, SessionAuthenticationProvider } from './sessionAuthenticationProvider';
import { AuthenticateType } from '../abstract/authenticationProvider';

describe('SessionAuthenticationProvider Test', () => {

  test('No Session Configuration', () => {
    const authenticationProvider = new SessionAuthenticationProvider(AuthenticateType.SESSION);
    const request = {};
    expect(() => authenticationProvider.getAuthentication(request)).toThrow(sessionAndFormMessage);
    expect(() => authenticationProvider.setAuthentication(request, null)).toThrow(sessionAndFormMessage);
  });

  test('Session Logout', () => {
    const authenticationProvider = new SessionAuthenticationProvider(AuthenticateType.SESSION);
    const request = { session: { authentication: null } };
    authenticationProvider.setAuthentication(request, null);
    expect(request.session.authentication).toBeUndefined();
  });

  test('FormLogin Set', () => {
    const formLogin = FormLogin.new()
      .loginPage('page')
      .loginUrl('login')
      .logoutUrl('logout')
      .redirectUrl("redirect");
    expect(formLogin.loginPage()).toBe('page');
    expect(formLogin.loginUrl()).toBe('login');
    expect(formLogin.logoutUrl()).toBe('logout');
    expect(formLogin.redirectUrl()).toBe('redirect');
  });
});