import { Authentication, Authenticator } from '../../../../../src';
import { UserService } from '../../api/dao/user.service';
import { FactoryProvider, Injectable } from '@nestjs/common';

export const authenticatorServiceProvider: FactoryProvider<Authenticator> = {
  provide: Authenticator,
  useFactory: (userService: UserService) => {
    return new AuthenticatorService(userService);
  },
  inject: [UserService]
};

@Injectable()
export class AuthenticatorService extends Authenticator {
  constructor(private userService: UserService) {
    super();
  }

  async authenticate(
    username: string,
    password?: string
  ): Promise<Authentication> {
    const user = await this.userService.user({
      email: username
    });
    if (user && user.password === password) {
      // @ts-ignore
      return {
        username,
        // @ts-ignore
        roles: user.roles.map((a) => a.name),
        // @ts-ignore
        authorities: user.authorities.map((a) => a.name)
      };
    }
    return undefined;
  }
}
