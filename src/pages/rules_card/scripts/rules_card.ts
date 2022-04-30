import { iterate } from '@/scripts/iterable'
import { CardSet } from './card_set'

function tryExtract(source: CardSet, pattern: CardSet): CardSet | null {
  if (iterate(pattern.cardCountPairs).every(([_, count]) => count <= 0)) {
    return null
  }
  if (
    iterate(pattern.cardCountPairs).some(
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
  complement: CardSet
}

interface Part {
  pattern: CardSet
  countNamedComplementsMap: Map<bigint, NamedComplement[]>
}

interface PartitionResult {
  rest: CardSet
  parts: Part[]
}

function* partition(
  source: CardSet,
  prototypes: readonly Part[],
  index: number,
  parts: Part[],
): Generator<PartitionResult, void, undefined> {
  if (index >= prototypes.length) {
    yield { rest: source.clone(), parts: [...parts] }
    return
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

interface SubPrototype {
  count: bigint
  prototype: Part
}

function* splitSubPrototypes(prototype: Part): Iterable<SubPrototype> {
  for (const [
    count,
    namedComplements,
  ] of prototype.countNamedComplementsMap.entries()) {
    yield {
      count,
      prototype: {
        pattern: prototype.pattern,
        countNamedComplementsMap: new Map([[count, namedComplements]]),
      },
    }
  }
}

function* partitionWithTotalComplementCount(
  source: CardSet,
  prototypes: readonly Part[],
  index: number,
  parts: Part[],
  totalComplementCount: bigint,
  targetTotalComplementCount: bigint,
): Generator<PartitionResult, void, undefined> {
  if (totalComplementCount > targetTotalComplementCount) {
    return
  }

  if (index >= prototypes.length) {
    if (
      totalComplementCount + source.totalCount() ===
      targetTotalComplementCount
    ) {
      yield { rest: source.clone(), parts: [...parts] }
    }
    return
  }

  const prototype = prototypes[index]
  const rest = tryExtract(source, prototype.pattern)
  if (rest != null) {
    for (const subPrototype of splitSubPrototypes(prototype)) {
      parts.push(subPrototype.prototype)
      yield* partitionWithTotalComplementCount(
        rest,
        prototypes,
        index,
        parts,
        totalComplementCount + subPrototype.count,
        targetTotalComplementCount,
      )
      parts.pop()
    }
  }

  yield* partitionWithTotalComplementCount(
    source,
    prototypes,
    index + 1,
    parts,
    totalComplementCount,
    targetTotalComplementCount,
  )
}

function makePrototypeKey(sortedCards: string[]): string {
  return JSON.stringify(sortedCards)
}

function* makeCardSubsets(
  cardSetCardCountPairs: [string, bigint][],
  index: number,
  cardSubset: CardSet,
): Iterable<CardSet> {
  if (index >= cardSetCardCountPairs.length) {
    yield cardSubset.clone()
    return
  }

  yield* makeCardSubsets(cardSetCardCountPairs, index + 1, cardSubset)

  const [card, maxCount] = cardSetCardCountPairs[index]
  for (let count = 0n; count < maxCount; ++count) {
    cardSubset.add(card, 1n)
    yield* makeCardSubsets(cardSetCardCountPairs, index + 1, cardSubset)
  }
  cardSubset.remove(card, maxCount)
}

function makeComplementCardSet(cardSet: CardSet, cardSubset: CardSet): CardSet {
  const complementCardSet = cardSet.clone()
  for (const [card, count] of cardSubset.cardCountPairs) {
    complementCardSet.remove(card, count)
  }
  return complementCardSet
}

class PrototypeStore {
  prototypeMap: Map<string, Part> = new Map()

  setDefaultPrototype(cardSubset: CardSet): Part {
    const key = makePrototypeKey(cardSubset.sortedCards())
    const prototype = this.prototypeMap.get(key)
    if (prototype == null) {
      const prototype = {
        pattern: cardSubset,
        countNamedComplementsMap: new Map(),
      }
      this.prototypeMap.set(key, prototype)
      return prototype
    } else {
      return prototype
    }
  }

  setDefaultNamedComplements(
    cardSubset: CardSet,
    complement: CardSet,
  ): NamedComplement[] {
    const prototype = this.setDefaultPrototype(cardSubset)

    const complementCount = complement.totalCount()
    const namedComplements =
      prototype.countNamedComplementsMap.get(complementCount)
    if (namedComplements == null) {
      const namedComplements: NamedComplement[] = []
      prototype.countNamedComplementsMap.set(complementCount, namedComplements)
      return namedComplements
    } else {
      return namedComplements
    }
  }

  registerCardSet(name: string, cardSet: CardSet): void {
    const cardCountPairs = [...cardSet.cardCountPairs]

    for (const cardSubset of makeCardSubsets(
      cardCountPairs,
      0,
      new CardSet(),
    )) {
      if (cardSubset.totalCount() > 0n) {
        const complement = makeComplementCardSet(cardSet, cardSubset)
        const namedComplements = this.setDefaultNamedComplements(
          cardSubset,
          complement,
        )
        namedComplements.push({ name, complement })
      }
    }
  }
}

interface PartitionOptions {
  complementCount?: bigint
  minComplementCount?: bigint
  maxComplementCount?: bigint
  totalComplementCount?: bigint
}

class Partitioner {
  prototypes: Part[]
  totalComplementCount?: bigint

  constructor(prototypeStore: PrototypeStore, options: PartitionOptions = {}) {
    this.totalComplementCount = options.totalComplementCount

    this.prototypes = [
      ...iterate(prototypeStore.prototypeMap.values())
        .map((originalPrototype): Part => {
          const prototype = {
            pattern: originalPrototype.pattern,
            countNamedComplementsMap: new Map(),
          }
          for (const [
            count,
            namedComplements,
          ] of originalPrototype.countNamedComplementsMap) {
            if (
              options.complementCount != null &&
              count != options.complementCount
            ) {
              continue
            }

            if (
              options.minComplementCount != null &&
              count < options.minComplementCount
            ) {
              continue
            }

            if (
              options.maxComplementCount != null &&
              count > options.maxComplementCount
            ) {
              continue
            }

            prototype.countNamedComplementsMap.set(count, namedComplements)
          }
          return prototype
        })
        .filter((prototype) => prototype.countNamedComplementsMap.size > 0),
    ]
  }

  partition(source: CardSet): Iterable<PartitionResult> {
    if (this.totalComplementCount == null) {
      return partition(source, this.prototypes, 0, [])
    } else {
      return partitionWithTotalComplementCount(
        source,
        this.prototypes,
        0,
        [],
        0n,
        this.totalComplementCount,
      )
    }
  }
}

export class RulesCard {
  private prototypeStore: PrototypeStore = new PrototypeStore()

  registerCardSet(name: string, cardSet: CardSet): void {
    this.prototypeStore.registerCardSet(name, cardSet)
  }

  partition(
    source: CardSet,
    options?: PartitionOptions,
  ): Iterable<PartitionResult> {
    return new Partitioner(this.prototypeStore, options).partition(source)
  }
}
