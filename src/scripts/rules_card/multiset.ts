import { Tagger } from './tagger'
import { Multisubset } from './multisubset'

export interface Tagged<T> {
  readonly tag: string
  readonly item: T
}

export interface Sample<T> {
  readonly subset: Multisubset<T>
  readonly complement: Multisubset<T>
}

export class Multiset<T> {
  private tagger: Tagger<T>
  private map: Map<string, T[]> = new Map()

  constructor(tagger: Tagger<T>) {
    this.tagger = tagger
  }

  private list(tag: string): T[] {
    let itemList = this.map.get(tag)
    if (itemList == null) {
      itemList = []
      this.map.set(tag, itemList)
    }
    return itemList
  }

  add(item: T): void {
    const tag = this.tagger.tag(item)
    this.list(tag).push(item)
  }

  removeOne(tag: string): T {
    const list = this.map.get(tag)
    if (list == null) {
      throw new Error(`No item tagged with '${tag}' exists.`)
    }
    const item = list.pop()
    if (item == null) {
      throw new Error(`No item tagged with '${tag}' exists.`)
    }

    if (list.length <= 0) {
      this.map.delete(tag)
    }

    return item
  }

  count(tag: string): number {
    return this.map.get(tag)?.length ?? 0
  }

  tags(): Iterable<string> {
    return this.map.keys()
  }

  samples(): Iterable<Sample<T>> {
    return new SampleRecurser([...this.map])
  }
}

class SampleRecurser<T> {
  private mapEntryList: [string, T[]][]
  private subsetItemList: Tagged<T>[] = []
  private complementItemList: Tagged<T>[] = []

  constructor(mapEntryList: [string, T[]][]) {
    this.mapEntryList = mapEntryList
  }

  [Symbol.iterator](): Iterator<Sample<T>, void, void> {
    return this.recurse(0)
  }

  *recurse(index: number): Generator<Sample<T>, void, void> {
    if (index >= this.mapEntryList.length) {
      yield {
        subset: new Multisubset(this.subsetItemList),
        complement: new Multisubset(this.complementItemList),
      }
      return
    }

    const [tag, items] = this.mapEntryList[index]
    const taggedItems: Tagged<T>[] = items.map((item) => ({ tag, item }))

    // Adds all items into complement
    for (const taggedItem of taggedItems) {
      this.complementItemList.push(taggedItem)
    }

    yield* this.recurse(index + 1)

    // Moves each item from complement into subset
    for (const taggedItem of taggedItems) {
      this.complementItemList.pop()
      this.subsetItemList.push(taggedItem)

      yield* this.recurse(index + 1)
    }

    // Removes all items from subset
    for (const _ of items) {
      this.subsetItemList.pop()
    }
  }
}
