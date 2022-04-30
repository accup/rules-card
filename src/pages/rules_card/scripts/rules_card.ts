import { iterate } from '@/scripts/iterable'
import { Hand } from './hand'

function tryExtract(source: Hand, pattern: Hand): Hand | null {
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
  complement: Hand
}

interface Part {
  pattern: Hand
  countNamedComplementsMap: Map<bigint, NamedComplement[]>
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

function makePrototypeKey(sortedCards: string[]): string {
  return JSON.stringify(sortedCards)
}

function* makeCardSubsets(
  cardsetCardCountPairs: [string, bigint][],
  index: number,
  cardSubset: Hand,
): Iterable<Hand> {
  if (index >= cardsetCardCountPairs.length) {
    yield cardSubset.clone()
    return
  }

  yield* makeCardSubsets(cardsetCardCountPairs, index + 1, cardSubset)

  const [card, maxCount] = cardsetCardCountPairs[index]
  for (let count = 0n; count < maxCount; ++count) {
    cardSubset.add(card, 1n)
    yield* makeCardSubsets(cardsetCardCountPairs, index + 1, cardSubset)
  }
  cardSubset.remove(card, maxCount)
}

function makeComplementCardset(cardset: Hand, cardSubset: Hand): Hand {
  const complementCardset = cardset.clone()
  for (const [card, count] of cardSubset.cardCountPairs) {
    complementCardset.remove(card, count)
  }
  return complementCardset
}

class PrototypeStore {
  prototypeMap: Map<string, Part> = new Map()

  setDefaultPrototype(cardSubset: Hand): Part {
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
    cardSubset: Hand,
    complement: Hand,
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

  registerCardset(name: string, cardset: Hand): void {
    const cardCountPairs = [...cardset.cardCountPairs]

    for (const cardSubset of makeCardSubsets(cardCountPairs, 0, new Hand())) {
      if (cardSubset.totalCount() > 0n) {
        const complement = makeComplementCardset(cardset, cardSubset)
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
}

class Partitioner {
  prototypes: Part[]

  constructor(prototypeStore: PrototypeStore, options: PartitionOptions = {}) {
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

  partition(source: Hand): Iterable<PartitionResult> {
    return partition(source, this.prototypes, 0, [])
  }
}

export class RulesCard {
  private prototypeStore: PrototypeStore = new PrototypeStore()

  registerCardset(name: string, cardset: Hand): void {
    this.prototypeStore.registerCardset(name, cardset)
  }

  partition(
    source: Hand,
    options?: PartitionOptions,
  ): Iterable<PartitionResult> {
    return new Partitioner(this.prototypeStore, options).partition(source)
  }
}
