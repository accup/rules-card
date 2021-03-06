import { ascendingCompare } from '@/scripts/compare'
import { iterate } from '@/scripts/iterable'

export class CardSet {
  private cardCountMap: Map<string, bigint>

  constructor(iterable?: Iterable<[string, bigint]>) {
    this.cardCountMap = new Map(iterable)
  }

  get cardCountPairs(): Iterable<[string, bigint]> {
    return this.cardCountMap.entries()
  }

  totalCount(): bigint {
    return iterate(this.cardCountMap.values()).reduce(
      BigInt('0'),
      (lastTotalCount, count) => lastTotalCount + count,
    )
  }

  count(card: string): bigint {
    return this.cardCountMap.get(card) ?? BigInt('0')
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

  add(card: string, count: bigint = BigInt('1')): void {
    if (count < BigInt('0')) {
      throw new Error(`'count' (${count}) must be a non-zero integer.`)
    }

    const lastCount = this.cardCountMap.get(card) ?? BigInt('0')
    const nextCount = lastCount + count
    if (nextCount > BigInt('0')) {
      this.cardCountMap.set(card, nextCount)
    }
  }

  remove(card: string, count: bigint = BigInt('1')): void {
    if (count < BigInt('0')) {
      throw new Error(`'count' (${count}) must be a non-zero integer.`)
    }

    const lastCount = this.cardCountMap.get(card) ?? BigInt('0')
    if (count > lastCount) {
      throw new Error(
        `'count' (${count}) must be less than or equal to the last count (${lastCount}).`,
      )
    }

    const nextCount = lastCount - count
    if (nextCount <= BigInt('0')) {
      this.cardCountMap.delete(card)
    } else {
      this.cardCountMap.set(card, nextCount)
    }
  }

  clone(): CardSet {
    return new CardSet(this.cardCountPairs)
  }

  toString(): string {
    const cardCountTexts = []
    for (const [card, count] of this.cardCountPairs) {
      cardCountTexts.push(`${card}: ${count}`)
    }
    return `${this.constructor.name}{${cardCountTexts.join(', ')}}`
  }
}
