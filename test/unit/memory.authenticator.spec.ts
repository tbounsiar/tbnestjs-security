import { MemoryAuthenticator, MemoryStore } from '../../src';

describe('MemoryAuthenticator Test', () => {
  test('MemoryAuthenticator With Empty Store Return Undefined', (done) => {
    const memoryAuthenticator = new MemoryAuthenticator(new MemoryStore());
    memoryAuthenticator
      .authenticate('user', 'password')
      .then((authentication) => {
        expect(authentication).toBeUndefined();
        done();
      });
  });
});
