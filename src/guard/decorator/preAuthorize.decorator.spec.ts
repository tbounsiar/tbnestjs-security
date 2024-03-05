import { getExpression } from './preAuthorize.decorator';

describe('PreAuthorize Test', () => {

  test('getExpression @Req()', () => {
    expect(getExpression('$.validate(@Req())')).toEqual('authentication.validate(request)');
  });

  test('getExpression @Ip("id")', () => {
    expect(() => getExpression('$.validate(@Ip("id"))')).toThrow('@Ip cannot have arg @Ip("id")');
  });

  test('getExpression @Headers()', () => {
    expect(getExpression('$.validate(@Headers())')).toEqual('authentication.validate(request.headers)');
  });
});