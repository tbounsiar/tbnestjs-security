import { DataExtractor } from '../iface/data.extractor';

export class JwtDataExtractor implements DataExtractor {
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
