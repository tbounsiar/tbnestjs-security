import { JwtTokenAuthenticationProvider } from './jwtTokenAuthenticationProvider';
import { JwtDataExtractor } from './jwtDataExtractor';

describe('JwtTokenAuthenticationProvider Test', () => {

  test('Data Extractor', () => {
    const decoded = {};
    const jwt = {
      verify: jest.fn(() => decoded),
    };
    const jwtDataExtractor = {
      getUsername: jest.fn(),
      getAuthorities: jest.fn(),
      getRoles: jest.fn(),
    } as JwtDataExtractor;
    const jwtTokenAuthenticationProvider = new JwtTokenAuthenticationProvider('', jwt);
    jwtTokenAuthenticationProvider.jwtTokenParser().dataExtractor(jwtDataExtractor);
    jwtTokenAuthenticationProvider.jwtTokenParser().parse('');
    expect(jwtDataExtractor.getUsername).toHaveBeenCalledWith(decoded);
    expect(jwtDataExtractor.getAuthorities).toHaveBeenCalledWith(decoded);
    expect(jwtTokenAuthenticationProvider.jwtTokenParser().dataExtractor()).toBe(jwtDataExtractor);
  });
});