import { UserAuthentication, UserAuthenticator } from '../../../../../src';
import { UserService } from '../../api/dao/user.service';
import { FactoryProvider, Injectable } from '@nestjs/common';

export const authenticatorServiceProvider: FactoryProvider<UserAuthenticator> =
  {
    provide: UserAuthenticator,
    useFactory: (userService: UserService) => {
      return new AuthenticatorService(userService);
    },
    inject: [UserService]
  };

@Injectable()
export class AuthenticatorService extends UserAuthenticator {
  constructor(private userService: UserService) {
    super();
  }

  async authenticate(
    username: string,
    password?: string
  ): Promise<UserAuthentication> {
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
