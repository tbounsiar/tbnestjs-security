/**
 * Get Roles And Authorities From Decoded JWT Token
 */
export interface DataExtractor {
  getUsername(decoded: any): string;
  getAuthorities(decoded: any): string[];
  getRoles(decoded: any): string[];
}
