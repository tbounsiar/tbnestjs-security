/**
 * Interface to implement a new Request Authentication
 */
export abstract class RequestAuthentication {
  abstract getUsername(): string;

  /**
   * Check if authentication has an authority
   * @param authority {string}: The authority
   */
  abstract hasAuthority(authority: string): boolean;

  /**
   * Check if authentication has any of authorities
   * @param authorities {string[]}: The authorities
   */
  abstract hasAnyAuthorities(...authorities: string[]): boolean;

  /**
   * Check if role has an authority
   * @param role {string}: The role
   */
  abstract hasRole(role: string): boolean;

  /**
   * Check if authentication has any of roles
   * @param roles {string[]}: The roles
   */
  abstract hasAnyRoles(...roles: string[]): boolean;

  /**
   * Check if Http Request is authenticated
   */
  abstract isAuthenticated(): boolean;
}
