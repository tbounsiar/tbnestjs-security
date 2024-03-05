import { AuthenticationBuilder } from './authenticationBuilder';
import { AuthErrorHandling } from './abstract/authErrorHandling';

describe('AuthenticationBuilder Test', () => {

  test('Custom Error Handling', () => {
    const authErrorHandling = {
      forbidden: jest.fn(),
      unauthorized: jest.fn(),
    } as AuthErrorHandling;
    const authenticationBuilder = new AuthenticationBuilder(null);
    authenticationBuilder.errorHandling(authErrorHandling);
    authenticationBuilder.errorHandling().forbidden();
    authenticationBuilder.errorHandling().unauthorized();
    expect(authErrorHandling.forbidden).toHaveBeenCalledTimes(1);
    expect(authErrorHandling.unauthorized).toHaveBeenCalledTimes(1);
  });
});