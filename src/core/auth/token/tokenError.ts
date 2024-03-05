/**
 * @internal
 */
export class TokenError extends Error {
  constructor(
    message: string,
    name?: string,
    public description?: string,
  ) {
    super(message);
    this.name = name;
  }
}
