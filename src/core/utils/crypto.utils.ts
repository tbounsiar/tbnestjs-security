import * as crypto from 'crypto';

/**
 * @internal
 * @param input
 * @param algorithm
 */
function hash(input: string, algorithm: string): string {
  const h = crypto.createHash(algorithm);
  h.update(input);
  return h.digest('hex');
}

/**
 * @internal
 * @param input
 */
export function md5(input: string): string {
  return hash(input, 'MD5');
}

/**
 * @internal
 * @param input
 * @param encoding
 */
export function base64Encode(input: string, encoding: BufferEncoding = 'utf-8'): string {
  return Buffer.from(input, encoding).toString('base64');
}

/**
 * @internal
 * @param input
 * @param encoding
 */
export function base64Decode(
  input: string,
  encoding: BufferEncoding = 'utf-8',
): string {
  return Buffer.from(input, 'base64').toString(encoding);
}

/**
 *
 * @param length
 */
export function generate(length: number) {
// Générer 4 bytes aléatoires
  const randomBytes = crypto.randomBytes(length);
  return randomBytes.toString('utf-8');
}
