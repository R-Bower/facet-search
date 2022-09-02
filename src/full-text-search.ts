import {matchSorter} from "match-sorter"

import {FullTextSearchInput, IndexedItem} from "./types"

export function fullTextSearch<I extends IndexedItem>(
  items: I[],
  input: FullTextSearchInput,
): number[] {
  const keys = input.searchableFields
  const query = input.query
  if (!keys?.length || !query?.length) {
    return []
  }

  return matchSorter<I>(items, query, {keys}).map((item) => {
    return item._id
  })
}
