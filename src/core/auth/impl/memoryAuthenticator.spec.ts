import { MemoryAuthenticator } from './memoryAuthenticator';

describe('MemoryAuthenticator Test', () => {

  test('MemoryAuthenticator With Empty Store Return Undefined' , ()=> {
    const memoryAuthenticator = new MemoryAuthenticator();
    expect(memoryAuthenticator.authenticate('user', 'password')).toBeUndefined()
  });
});