import { DigestWebAuthenticationProvider } from './digestWebAuthenticationProvider';
import * as utils from '../../utils/utils';
import { AuthenticationBuilder } from '../authenticationBuilder';
import { Authenticator } from '../abstract/authenticator';

describe('DigestWebAuthenticationProvider Test', () => {

  test('Non match authorization throw error', () => {
    const digest = new DigestWebAuthenticationProvider(null);
    const authentication = () => digest.getAuthentication({
      headers: {
        authorization: 'Basic ',
      },
    });
    expect(() => authentication()).toThrow('Invalid Authorization');
  });

  test('Old nonce will be removed and match authorization return non authentication', () => {
    const id = '1234567890';
    // @ts-ignore
    utils.generate = (length: number) => {
      return id;
    };
    const date = Date.now() - 3600000;
    const oldNow = Date.now;
    Date.now = () => date;
    const digest = new DigestWebAuthenticationProvider(
      new AuthenticationBuilder(null),
    );
    digest.realm('Digest Authentication Test');
    digest.getAskHeader();
    Date.now = oldNow;
    const authentication = digest.getAuthentication({
      headers: {
        authorization: 'Digest username="paul", realm="Digest Authentication Test", nonce="e807f1fcf82d132f9bb018ca6738a19f", uri="/", response="ea93da2ccb7b46e41c121ef8c675cc0b", nc=00000001',
      },
    });
    expect(authentication.isAuthenticated()).toBeFalsy();
    // @ts-ignore
    expect(digest.nonces.length).toBe(0);
  });

  test('Valid Nonce Will be Created', () => {
    const id = '1234567890';
    // @ts-ignore
    utils.generate = (length: number) => {
      return id;
    };
    const authenticator = {
      authenticate: jest.fn(() => undefined),
    } as unknown as Authenticator;
    const authenticationBuilder = new AuthenticationBuilder(null);
    authenticationBuilder.authenticator(authenticator);
    const digest = new DigestWebAuthenticationProvider(
      authenticationBuilder,
    );
    digest.realm('Digest Authentication Test');
    digest.getAskHeader();
    const authentication = digest.getAuthentication({
      headers: {
        authorization: 'Digest username="paul", realm="Digest Authentication Test", nonce="e807f1fcf82d132f9bb018ca6738a19f", uri="/", response="ea93da2ccb7b46e41c121ef8c675cc0b", nc=00000001',
      },
    });
    expect(authentication.isAuthenticated()).toBeFalsy();
    // @ts-ignore
    expect(digest.nonces[0].id).toBe('e807f1fcf82d132f9bb018ca6738a19f');
  });
});