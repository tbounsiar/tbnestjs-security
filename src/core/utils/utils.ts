import { RequestMatcher } from '../http/requestMatcher';
import { pathToRegexp } from 'path-to-regexp';

/**
 * @internal
 * @param matchers
 */
export function getMatchExpression(matchers: RequestMatcher[]): string {
  const permissions = [];
  let expression = undefined;
  matchers.forEach((matcher) => {
    matcher.permissions().forEach((p) => {
      permissions.push(`authentication.${p}`);
    });
  });
  if (permissions.length > 0) {
    expression = permissions.join(' || ');
  }
  return expression;
}

/**
 * @internal
 * Fix pathToRegexp bug
 * @param regex
 */
export function pathToRegex(...regex: (string | RegExp)[]) {
  const source = pathToRegexp(regex).source.replace(/\[\\\/#\\\?\]\?\$/g, '');
  return new RegExp(source + '(?:[\\/#\\?].*)?$');
}

/**
 * @internal
 * @param length
 */
export function generate(length: number) {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
