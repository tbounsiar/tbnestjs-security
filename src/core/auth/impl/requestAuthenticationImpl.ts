import { RequestAuthentication } from '../abstract/requestAuthentication';
import { Authentication } from '../abstract/authentication';

/**
 * @internal
 */
export class RequestAuthenticationImpl implements RequestAuthentication {

  private roles: string[] = [];
  private authorities: string[] = [];
  private readonly username: string;

  constructor(private authentication?: Authentication) {
    if (authentication) {
      this.username = authentication.username;
      this.authorities = authentication.authorities || [];
      this.roles = authentication.roles || [];
    }
  }

  getUsername(): string {
    return this.username;
  }

  hasAuthority(authority: string): boolean {
    return this.authorities.indexOf(authority) !== -1;
  }

  hasAnyAuthorities(...authorities: string[]): boolean {
    for (const authority of authorities) {
      if (this.hasAuthority(authority)) {
        return true;
      }
    }
    return false;
  }

  hasRole(role: string): boolean {
    return this.roles.indexOf(role) !== -1;
  }

  hasAnyRoles(...roles: string[]): boolean {
    for (const role of roles) {
      if (this.hasRole(role)) {
        return true;
      }
    }
    return false;
  }

  isAuthenticated(): boolean {
    return !!this.authentication;
  }
}
