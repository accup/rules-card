function* map<T, U>(
  iterable: Iterable<T>,
  convert: (item: T) => U,
): Iterable<U> {
  for (const item of iterable) {
    yield convert(item)
  }
}

function* filter<T>(
  iterable: Iterable<T>,
  predicate: (item: T) => boolean,
): Iterable<T> {
  for (const item of iterable) {
    if (predicate(item)) {
      yield item
    }
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

  reduce<U>(initialValue: U, accumulate: (lastValue: U, item: T) => U): U {
    let value = initialValue
    for (const item of this.iterable) {
      value = accumulate(value, item)
    }
    return value
  }

  filter(predicate: (item: T) => boolean): Iteration<T> {
    return iterate(filter(this, predicate))
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
