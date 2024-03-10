import { Provider, SecurityConfig } from '../../../../src';
import {
  AuthenticatorService,
  authenticatorServiceProvider
} from './service/authenticator.service';
import { PrismaService } from '../api/dao/prisma.service';
import { UserService } from '../api/dao/user.service';

const builder = SecurityConfig.builder();
// builder
//   .authenticationBuilder()
//   .authenticationProvider(Provider.sessionAuthentication());
//
// builder.authenticationBuilder()
//   .authenticator(AuthenticatorService);
//   // .authenticator(authenticatorServiceProvider);
// builder.httpSecurity().csrf().enable();
// builder.metadata({
//   providers: [PrismaService, UserService]
//   // exports: [PrismaService, UserService]
// });

export const securityConfig = builder.build();
