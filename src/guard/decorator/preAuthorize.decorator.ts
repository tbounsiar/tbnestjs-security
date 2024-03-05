import { Reflector } from '@nestjs/core';

/**
 * Decorator for specifying a method access-control expression which will be evaluated to decide whether a method invocation is allowed or not.
 * @param {string} authorization: The method access-control expression
 * @constructor
 */
export const PreAuthorize = Reflector.createDecorator<string>();

/**
 * @internal
 */
const REQ_ARG = {
  Session: 'session',
  Param: 'params',
  Body: 'body',
  Query: 'query',
  Headers: 'headers',
  HostParam: 'hosts',
  Ip: 'ip',
};

/**
 * @internal
 */
const ARG_REGEX =
  /@(Param|Query|Body|Headers|Session|HostParam|Request|Req|Ip)\(('([A-Za-z0-9_-]+)'|"([A-Za-z0-9_-]+)")?\)/;

/**
 * @internal
 */
export function getExpression(authorization: string): string {
  while (ARG_REGEX.test(authorization)) {
    authorization = authorization.replace(ARG_REGEX, replaceFn);
  }
  const AND_REGEX = /(\)|[ \n]+)(AND|and|And)/;
  while (AND_REGEX.test(authorization)) {
    authorization = authorization.replace(AND_REGEX, '$1&&');
  }
  const OR_REGEX = /(\)|[ \n]+)(OR|or|Or)/;
  while (OR_REGEX.test(authorization)) {
    authorization = authorization.replace(OR_REGEX, '$1||');
  }
  authorization = authorization.replace(/\$./g, 'authentication.');
  return authorization;
}

/**
 * @internal
 */
function replaceFn(match: string): string {
  // Matched substring is passed as a parameter
  const groups = ARG_REGEX.exec(match);
  const rep = 'request';
  if (REQ_ARG[groups[1]]) {
    if (groups[1] === 'Ip' && groups[4]) {
      throw new Error('@Ip cannot have arg ' + match);
    }
    return (
      rep +
      '.' +
      REQ_ARG[groups[1]] +
      (groups[4] ? '["' + groups[4] + '"]' : '')
    );
  }
  return rep;
}
