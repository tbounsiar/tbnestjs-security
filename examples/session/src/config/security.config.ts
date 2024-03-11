// import {
//   AuthorizeRequests,
//   FormLogin,
//   Provider,
//   RequestMatcher,
//   SecurityConfig,
//   SecurityModule
// } from '../../../../src';

import {
  AuthorizeRequests,
  Provider,
  RequestMatcher,
  SecurityConfig,
  SecurityModule
} from '@tbnestjs/security';
import { AuthenticatorService } from './service/authenticator.service';
import { UserService } from '../api/dao/user.service';
import { PrismaService } from '../api/dao/prisma.service';

const builder = SecurityConfig.builder();
builder.httpSecurity().csrf().enable();
builder
  .httpSecurity()
  .authorize(
    AuthorizeRequests.with()
      .requestMatcher(RequestMatcher.match('/admin/(.*)').hasRole('ADMIN'))
      .requestMatcher(RequestMatcher.anyRequest().hasAnyRoles('ADMIN', 'USER'))
  );

// builder.authenticationBuilder().authenticator(authenticatorServiceProvider);
builder.authenticationBuilder().authenticator(AuthenticatorService);
builder.metadata({
  providers: [UserService, PrismaService]
});
const sessionAuthentication =
  Provider.sessionAuthentication().credentialsExtractor((request: any) => {
    return { username: request.body.email, password: request.body.password };
  });
sessionAuthentication
  .formLogin()
  .disableDefault()
  .loginPage('/custom/login/page')
  .loginUrl('/custom/login')
  .logoutUrl('/custom/logout');
builder.authenticationBuilder().authenticationProvider(sessionAuthentication);
export const securityModule = SecurityModule.forRoot(builder);
