import BitSet from "bitset"

import {Facets} from "./facets"
import {fullTextSearch} from "./full-text-search"
import {getBuckets} from "./get-buckets"
import {sortItems} from "./helpers"
import {Buckets, Configuration, Item, SearchInput} from "./types"

export interface SearchResult<I extends Item> {
  data: {
    allFilteredItems?: I[]
    facets: Record<
      string,
      {buckets: Buckets<I>; name: string; position: number}
    >
    items: I[]
  }
  pagination: {
    page: number
    perPage: number
    total: number
  }
}

export function search<I extends Item, S extends string>(
  facets: Facets<I, S>,
  input: SearchInput<I, S> = {},
  configuration: Configuration<I, S>,
): SearchResult<I> {
  const perPage = input.perPage || 12
  const page = input.page || 1
  const isAllFilteredItems = input.isAllFilteredItems || false

  let queryIds: BitSet | undefined
  // all ids bitmap
  let filteredIndexesBitmap = facets.getBitIds()
  let ids: number[] | undefined
  let allFilteredItems: I[] | undefined

  const {query} = input
  const {searchableFields} = configuration
  if (query?.length && searchableFields?.length) {
    ids = fullTextSearch(facets.getItems(), {
      query,
      searchableFields,
    })
    queryIds = new BitSet(ids)
  }

  const facetResult = facets.search(input, {
    queryIds,
  })

  if (queryIds) {
    filteredIndexesBitmap = queryIds
  }

  if (facetResult.ids) {
    filteredIndexesBitmap = filteredIndexesBitmap.and(facetResult.ids)
  }

  // new filters to items
  // -------------------------------------
  let filteredIndices = filteredIndexesBitmap.toArray()

  let filteredItems: Array<I & {_id?: number}> | undefined =
    filteredIndices.map((_id: number) => {
      return facets.getItem(_id)
    })

  /**
   * sorting items
   */
  let paginationApplied = false
  if (input.sort) {
    // sorting takes precedence over search ranking
    filteredItems = sortItems(filteredItems, input.sort, configuration.sortings)
  } else {
    if (ids) {
      filteredIndices = ids.filter((v: number) => {
        return filteredIndexesBitmap.get(v)
      })

      const filteredItemsIndices = filteredIndices.slice(
        (page - 1) * perPage,
        page * perPage,
      )
      filteredItems = filteredItemsIndices.map((_id) => {
        return facets.getItem(_id)
      })

      paginationApplied = true
    }
  }
  // pagination
  if (!paginationApplied) {
    allFilteredItems = isAllFilteredItems ? filteredItems : undefined
    filteredItems = filteredItems.slice((page - 1) * perPage, page * perPage)
  }

  return {
    data: {
      allFilteredItems,
      facets: getBuckets(
        facetResult,
        input.filters ?? {},
        configuration.filterFields,
      ),
      items: filteredItems.map(({_id, ...item}) => item) as I[],
    },
    pagination: {
      page,
      perPage: perPage,
      total: filteredIndices.length,
    },
  }
}
