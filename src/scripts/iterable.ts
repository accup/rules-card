function* map<T, U>(
  iterable: Iterable<T>,
  convert: (item: T) => U,
): Iterable<U> {
  for (const item of iterable) {
    yield convert(item)
  }
}

class Iteration<T> {
  private iterable: Iterable<T>

  constructor(iterable: Iterable<T>) {
    this.iterable = iterable
  }

  *[Symbol.iterator](): Iterator<T, void, undefined> {
    yield* this.iterable
  }

  map<U>(convert: (item: T) => U): Iteration<U> {
    return iterate(map(this, convert))
  }

  some(predicate: (item: T) => boolean): boolean {
    for (const item of this.iterable) {
      if (predicate(item)) {
        return true
      }
    }
    return false
  }

  every(predicate: (item: T) => boolean): boolean {
    for (const item of this.iterable) {
      if (!predicate(item)) {
        return false
      }
    }
    return true
  }
}

export function iterate<T>(iterable: Iterable<T>): Iteration<T> {
  return new Iteration(iterable)
}
