export function ascendingCompare<T>(a: T, b: T): number {
  if (a < b) {
    return -1
  } else if (a > b) {
    return 1
  } else {
    return 0
  }
}

export function descendingCompare<T>(a: T, b: T): number {
  if (a < b) {
    return 1
  } else if (a > b) {
    return -1
  } else {
    return 0
  }
}
