import { UserAuthenticator } from '../../src/core/auth/abstract/user.authenticator';
import * as crypto from 'crypto';
import { DigestOptions } from '../../src/core/auth/impl/digest/digest.options';
import { DigestWebAuthenticationProvider } from '../../src/core/auth/impl/digest/digest-web-authentication.provider';

describe('DigestWebAuthenticationProvider Test', () => {
  let options: DigestOptions;

  beforeEach(async () => {
    // @ts-ignore
    crypto.randomBytes = (length: number) => {
      return Buffer.from('1234567890');
    };
    options = new DigestOptions();
  });

  test('Non match authorization throw error', (done) => {
    const digest = new DigestWebAuthenticationProvider(null, options);
    digest
      .getAuthentication({
        headers: {
          authorization: 'Basic '
        }
      })
      .then(
        (value) => {},
        (reason) => {
          expect(reason.message).toBe('Invalid Authorization');
          done();
        }
      );
  });

  test('Old nonce will be removed and match authorization return non authentication', async () => {
    const date = Date.now() - 3600000;
    const oldNow = Date.now;
    Date.now = () => date;
    const authenticator = {
      authenticate: jest.fn(() => undefined)
    } as unknown as UserAuthenticator;
    const digest = new DigestWebAuthenticationProvider(authenticator, options);
    digest.getAskHeader();
    Date.now = oldNow;
    const authentication = await digest.getAuthentication({
      headers: {
        authorization:
          'Digest username="paul", realm="Digest Authentication Test", nonce="e807f1fcf82d132f9bb018ca6738a19f", uri="/", response="ea93da2ccb7b46e41c121ef8c675cc0b", nc=00000001'
      }
    });
    expect(authentication.isAuthenticated()).toBeFalsy();
    // @ts-ignore
    expect(digest.nonces.length).toBe(0);
  });

  test('Valid Nonce Will be Created', async () => {
    const authenticator = {
      authenticate: jest.fn(() => undefined)
    } as unknown as UserAuthenticator;
    options.realm('Digest Authentication Test');

    const digest = new DigestWebAuthenticationProvider(authenticator, options);

    digest.getAskHeader();
    const authentication = await digest.getAuthentication({
      headers: {
        authorization:
          'Digest username="paul", realm="Digest Authentication Test", nonce="e807f1fcf82d132f9bb018ca6738a19f", uri="/", response="ea93da2ccb7b46e41c121ef8c675cc0b", nc=00000001'
      }
    });
    expect(authentication.isAuthenticated()).toBeFalsy();
    // @ts-ignore
    expect(digest.nonces[0].id).toBe('f58163434437bc3fb33d971645a39820');
  });
});
