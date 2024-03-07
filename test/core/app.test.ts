import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DigestAlgorithm, SecurityConfig } from '../../src';
import { md5 } from '../../src/core/utils/crypto.utils';
// @ts-ignore
import { Options, REALM } from './app.config';

export type Method = 'get' | 'post';

export interface Input {
  url: string,
  method?: Method
  headers?: Record<string, any>;
  body?: any;
  type?: string;
  send?: any;
  cookies?: string[];
}

interface Call {
  function: Function,
  with?: any;
  times?: number;
}

interface SetCookie {
  key: string;
  reset?: boolean;
}

export interface Output {
  status?: number;
  unauthorized?: boolean;
  forbidden?: boolean;
  body?: any;
  text?: any;
  headers?: Record<string, any>;
  calls?: Call[];
  retest?: {
    input?: Input,
    output?: Output
  };
  setCookies?: SetCookie[];
  check? : (contex: Context, response?: any) => void,
}

export interface Context {
  application: INestApplication;
  securityConfig: SecurityConfig;
  data?: any
}

export function doTest(context: Context, input: Input, output: Output, name?: string, init?: (context: Context) => void) {

  const description = buildDescription(input, output, name);
  // const func =
  test(description, (done) => {

    if (init) {
      init(context);
    }

    const req = request(context.application.getHttpServer());
    doRequest(context, req, done, input, output);
  });
}

export function doRequest(context: Context, request, done, input: Input, output: Output) {

  input.method = input.method || 'get';
  output.status = output.status || 200;

  let agent = request[input.method](input.url);
  if (input.headers) {
    agent = agent.set(input.headers);
  }

  if (input.cookies){
    agent = agent.set('Cookie', input.cookies);
  }

  if (input.type){
    agent = agent.type(input.type);
  }

  if(input.send){
    agent = agent.send(input.send);
  }

  agent.end((error, response) => {
    if (error) {
      return done(error);
    }
    if (output.calls) {
      for (const call of output.calls) {
        if (call.with) {
          expect(call.function).toHaveBeenCalledWith(call.with);
        }
        if (call.times) {
          expect(call.function).toHaveBeenCalledTimes(call.times);
        }
      }
    }
    if (output.headers) {
      for (let key in output.headers) {
        expect(response.headers[key]).toBe(output.headers[key]);
      }
    }
    if (output.unauthorized || output.forbidden) {
      expect(output.unauthorized ? response.unauthorized : response.unauthorized);
      expect(response.body).toEqual({
        message: output.unauthorized ? 'Unauthorized' : 'Forbidden',
        statusCode: output.unauthorized ? 401 : 403,
        url: input.url,
      });
    } else {
      expect(response.status).toBe(output.status);
      if (output.body) {
        expect(response.body).toBe(output.body);
      }
      if (output.text) {
        expect(response.text).toBe(output.text);
      }
    }
    if (output.setCookies) {
      let nextInput;
      if(output.retest){
        nextInput = output.retest.input || input;
      }
      for (const setCookie of output.setCookies) {
        const cookie = response.get('Set-Cookie').find(c => c.startsWith(`${setCookie.key}=`));
        expect(cookie).toBeTruthy();
        if (output.retest) {
          if(!nextInput.cookies){
            nextInput.cookies = [];
          }
          nextInput.cookies.push(cookie);
        }
      }
    }
    if (output.check){
      output.check(context, response);
    }
    if (output.retest) {
      doRequest(context, request, done, output.retest.input || input, output.retest.output || output);
    } else {
      done();
    }
  });
}

function buildDescription(input: Input, output: Output, name?: string) {

  input.method = input.method || 'get';
  output.status = output.status || 200;

  const description = [name, `When Request ${input.method.toUpperCase()}(${input.url})`];
  if (input.headers) {
    description.push(`\tWith Headers ${JSON.stringify(input.headers)}`);
  }
  if (input.body) {
    description.push(`\tWith Body {${JSON.stringify(input.body)}}`);
  }
  description.push('Expect The Response');
  if (output.unauthorized || output.forbidden) {
    description.push(`\tError To Be ` + (output.unauthorized ? 'Unauthorized' : 'Forbidden'));
    description.push(`\tWith Body ` + JSON.stringify({
      message: output.unauthorized ? 'Unauthorized' : 'Forbidden',
      statusCode: output.unauthorized ? 401 : 403,
      url: input.url,
    }));
  } else {
    description.push(`\tStatus To Be ${output.status}`);
  }
  if (output.body || output.text) {
    description.push(`\tWith Body ${output.body || output.text}`);
  }
  if (output.headers) {
    description.push(`\tWith Headers ${JSON.stringify(output.headers)}`);
  }
  return description.join(' \n');
}

export function createDigestAuthorization(option: {
  username: string,
  password: string,
  method: string,
  uri: string,
  body?: string
  realm: string,
  nonce: string,
  nc: string,
  opaque: string,
  cnonce: string,
  qop?: string | boolean,
  algorithm: DigestAlgorithm
}) {
  let ha1 = md5(`${option.username}:${option.realm}:${option.password}`);
  if (option.algorithm === 'MD5-sess') {
    ha1 = md5(`${ha1}:${option.nonce}:${option.cnonce}`);
  }
  const ha2 = md5(`${option.method}:${option.uri}`);
  const response = option.qop ?
    md5(
      `${ha1}:${option.nonce}:${option.nc}:${option.cnonce}:${option.qop}:${ha2}`,
    ) :
    md5(`${ha1}:${option.nonce}:${ha2}`);

  return `Digest username="${option.username}", realm="${option.realm}", nonce="${option.nonce}", uri="${option.uri}", algorithm=${option.algorithm}, qop=${option.qop}, nc=${option.nc}, cnonce="${option.cnonce}", response="${response}", opaque="${option.opaque}"`;
}

export function createDigetAuthenticationHeader(options?: Options) {

  const header = [
    `Digest realm="${REALM}"`,
  ];

  if (options?.domain) {
    header.push(`domain="${options.domain}"`);
  }
  header.push(`nonce="e807f1fcf82d132f9bb018ca6738a19f"`);

  if (options?.opaque) {
    header.push(`opaque="e807f1fcf82d132f9bb018ca6738a19f"`);
  }

  if (options?.algorithm) {
    header.push(`algorithm="${options.algorithm}"`);
  }

  if (options?.qop) {
    header.push(`qop="${options.qop}"`);
  }

  return header.join(', ');
}