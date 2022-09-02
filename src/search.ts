import BitSet from "bitset"
import {orderBy} from "lodash-es"

import {Facets} from "./facets"
import {getBuckets} from "./get-buckets"
import {Buckets, Configuration, SearchOptions, Sorting} from "./types"

export interface SearchResult<I extends Record<string, unknown>> {
  data: {
    aggregations: Record<
      string,
      {buckets: Buckets<I>; name: string; position: number}
    >
    allFilteredItems?: I[]
    items: I[]
  }
  pagination: {
    page: number
    per_page: number
    total: number
  }
}

export function search<
  I extends Record<string, unknown>,
  S extends string,
  A extends string,
>(
  items: I[],
  input: SearchOptions<I, S, A> = {},
  configuration: Configuration<I, S, A>,
  facets: Facets<I, S, A>,
): SearchResult<I> {
  const perPage = input.per_page || 12
  const page = input.page || 1
  const isAllFilteredItems = input.is_all_filtered_items || false

  let queryIds
  // all ids bitmap
  let filteredIndexesBitmap = facets.bits_ids()
  let ids
  let allFilteredItems: I[] | undefined

  if (input._ids) {
    queryIds = new BitSet(input._ids)
    ids = input._ids
  } else if (input.ids) {
    ids = facets.internal_ids_from_ids_map(input.ids)
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

  let filteredItems: I[] | undefined = filteredIndices.map((_id: number) => {
    return facets.get_item(_id)
  })

  /**
   * sorting items
   */
  let paginationApplied = false
  if (input.sort) {
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
        return facets.get_item(_id)
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
      aggregations: getBuckets(facetResult, input, configuration.aggregations),
      allFilteredItems,
      items: filteredItems,
    },
    pagination: {
      page,
      per_page: perPage,
      total: filteredIndices.length,
    },
  }
}

/**
 * return items by sort
 */
export function sortItems<I extends Record<string, unknown>, S extends string>(
  items: I[],
  sort: S | Sorting<I>,
  sortings?: Record<S, Sorting<I>>,
): I[] {
  if (typeof sort === "string" && sortings && sortings[sort]) {
    sort = sortings[sort]
  }

  if (typeof sort !== "string" && sort.field) {
    return orderBy(items, sort.field, sort.order || "asc")
  }

  return items
}
