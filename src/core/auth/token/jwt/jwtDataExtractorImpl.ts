import { JwtDataExtractor } from './jwtDataExtractor';

export class JwtDataExtractorImpl implements JwtDataExtractor{
  getAuthorities(decoded: any): string[] {
    return decoded?.claims?.authorities || [];
  }

  getRoles(decoded: any): string[] {
    return decoded?.claims?.roles || [];
  }

  getUsername(decoded: any): string {
    return decoded?.username;
  }

}