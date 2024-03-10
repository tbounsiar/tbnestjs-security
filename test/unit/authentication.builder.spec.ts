import { AuthenticationBuilder } from '../../src/core/auth/authentication.builder';
import { AuthenticationErrorHandling } from '../../src/core/auth/abstract/authentication-error.handling';

describe('AuthenticationBuilder Test', () => {
  test('Custom Error Handling', () => {
    const authErrorHandling = {
      forbidden: jest.fn(),
      unauthorized: jest.fn()
    } as AuthenticationErrorHandling;
    const authenticationBuilder = new AuthenticationBuilder(null);
    authenticationBuilder.errorHandling(authErrorHandling);
    authenticationBuilder.errorHandling().forbidden(null);
    authenticationBuilder.errorHandling().unauthorized(null);
    expect(authErrorHandling.forbidden).toHaveBeenCalledTimes(1);
    expect(authErrorHandling.unauthorized).toHaveBeenCalledTimes(1);
  });
});
