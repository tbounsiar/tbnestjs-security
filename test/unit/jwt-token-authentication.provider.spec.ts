import { JwtTokenAuthenticationProvider } from '../../src';
import { DataExtractor } from '../../src';
import { JwtTokenOptions } from '../../src/core/auth/token/jwt/jwt-token.options';

describe('JwtTokenAuthenticationProvider Test', () => {
  test('Data Extractor', () => {
    const decoded = {};
    const jwt = {
      verify: jest.fn(() => decoded)
    };
    const options = {
      secret: jest.fn(),
      jwt: jest.fn(() => jwt)
    } as unknown as JwtTokenOptions;
    const jwtDataExtractor = {
      getUsername: jest.fn(),
      getAuthorities: jest.fn(),
      getRoles: jest.fn()
    } as DataExtractor;
    const jwtTokenAuthenticationProvider = new JwtTokenAuthenticationProvider(
      options
    );
    jwtTokenAuthenticationProvider
      .jwtTokenParser()
      .dataExtractor(jwtDataExtractor);
    jwtTokenAuthenticationProvider.jwtTokenParser().parse('');
    expect(jwtDataExtractor.getUsername).toHaveBeenCalledWith(decoded);
    expect(jwtDataExtractor.getAuthorities).toHaveBeenCalledWith(decoded);
    expect(
      jwtTokenAuthenticationProvider.jwtTokenParser().dataExtractor()
    ).toBe(jwtDataExtractor);
  });
});
