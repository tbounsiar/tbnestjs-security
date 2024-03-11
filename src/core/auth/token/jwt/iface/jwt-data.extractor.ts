/**
 * Get User Roles And Authorities From Token
 */
export interface JwtDataExtractor {
  getUsername(decoded: any): string;
  getAuthorities(decoded: any): string[];
  getRoles(decoded: any): string[];
}
