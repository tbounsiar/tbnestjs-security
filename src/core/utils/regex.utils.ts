import { pathToRegexp } from 'path-to-regexp';

/**
 * @internal
 * Fix pathToRegexp bug
 * @param regex
 */
export function pathToRegex(...regex: (string | RegExp)[]) {
  const source = pathToRegexp(regex).source.replace(/\[\\\/#\\\?\]\?\$/g, '');
  return new RegExp(source + '(?:[\\/#\\?].*)?$');
}
