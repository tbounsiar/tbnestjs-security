/**
 * Get Roles And Authorities From Decoded JWT Token
 */
export interface JwtDataExtractor {
  getUsername(decoded: any): string;
  getAuthorities(decoded: any): string[];
  getRoles(decoded: any): string[];
}
