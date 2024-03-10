/**
 * @internal
 */
export class Wrapper<O> {
  constructor(private o: O) {}

  get(): O {
    return this.o;
  }

  set(o: O) {
    this.o = o;
  }
}
