import { ascendingCompare } from '@/scripts/compare'
import { iterate } from '@/scripts/iterable'

export class Hand {
  private cardCountMap: Map<string, bigint>

  constructor(iterable?: Iterable<[string, bigint]>) {
    this.cardCountMap = new Map(iterable)
  }

  get cardCountPairs(): Iterable<[string, bigint]> {
    return this.cardCountMap.entries()
  }

  count(card: string): bigint {
    return this.cardCountMap.get(card) ?? 0n
  }

  sortedCards(): string[] {
    const sortedCards = []
    for (const [card, count] of this.cardCountPairs) {
      for (let index = 0; index < count; ++index) {
        sortedCards.push(card)
      }
    }
    sortedCards.sort(ascendingCompare)
    return sortedCards
  }

  add(card: string, count: bigint = 1n): void {
    if (count < 0n) {
      throw new Error(`'count' (${count}) must be a non-zero integer.`)
    }

    const lastCount = this.cardCountMap.get(card) ?? 0n
    const nextCount = lastCount + count
    this.cardCountMap.set(card, nextCount)
  }

  remove(card: string, count: bigint = 1n): void {
    if (count < 0n) {
      throw new Error(`'count' (${count}) must be a non-zero integer.`)
    }

    const lastCount = this.cardCountMap.get(card) ?? 0n
    if (count > lastCount) {
      throw new Error(
        `'count' (${count}) must be less than or equal to the last count (${lastCount}).`,
      )
    }

    const nextCount = lastCount - count
    if (nextCount <= 0n) {
      this.cardCountMap.delete(card)
    } else {
      this.cardCountMap.set(card, nextCount)
    }
  }

  clone(): Hand {
    return new Hand(this.cardCountPairs)
  }

  toString(): string {
    const cardCountTexts = []
    for (const [card, count] of this.cardCountPairs) {
      cardCountTexts.push(`${card}: ${count}`)
    }
    return `${this.constructor.name}{${cardCountTexts.join(', ')}}`
  }
}

function tryExtract(source: Hand, pattern: Hand): Hand | null {
  if (iterate(source.cardCountPairs).every(([_, count]) => count <= 0)) {
    return null
  }
  if (
    iterate(source.cardCountPairs).some(
      ([card, count]) => count > source.count(card),
    )
  ) {
    return null
  }

  const rest = source.clone()
  for (const [card, count] of pattern.cardCountPairs) {
    rest.remove(card, count)
  }

  return rest
}

interface NamedComplement {
  name: string
  complement: Hand
}

interface Part {
  pattern: Hand
  namedComplements: NamedComplement[]
}

interface PartitionResult {
  rest: Hand
  parts: Part[]
}

function* partition(
  source: Hand,
  prototypes: readonly Part[],
  index: number,
  parts: Part[],
): Generator<PartitionResult, void, undefined> {
  if (index > prototypes.length) {
    yield { rest: source.clone(), parts: [...parts] }
  }

  const prototype = prototypes[index]
  const rest = tryExtract(source, prototype.pattern)
  if (rest != null) {
    parts.push(Object.assign({}, prototype))
    yield* partition(rest, prototypes, index, parts)
    parts.pop()
  }

  yield* partition(source, prototypes, index + 1, parts)
}
