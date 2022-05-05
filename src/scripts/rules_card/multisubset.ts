import { Tagged } from './multiset'

export class Multisubset<T> {
  private map: Map<string, T[]> = new Map()

  constructor(taggedItems: Iterable<Tagged<T>>) {
    for (const { tag, item } of taggedItems) {
      this.list(tag).push(item)
    }
  }

  private list(tag: string): T[] {
    let itemList = this.map.get(tag)
    if (itemList == null) {
      itemList = []
      this.map.set(tag, itemList)
    }
    return itemList
  }

  *tags(): Iterable<string> {
    for (const [tag, list] of this.map) {
      for (let index = 0; index < list.length; ++index) {
        yield tag
      }
    }
  }

  sortedTagList(): string[] {
    return [...this.tags()].sort()
  }

  id(): string {
    return JSON.stringify(this.sortedTagList())
  }
}
