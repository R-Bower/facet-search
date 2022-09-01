import {orderBy} from "lodash-es"
import BitSet from "typedfastbitset"

import {getBuckets} from "./get-buckets"
import {Configuration, SearchOptions} from "./types"

export function search<
  I extends Record<string, unknown>,
  S extends string,
  A extends string,
>(
  items: I[],
  input: SearchOptions<I, S, A>,
  configuration: Configuration<I, S, A>,
  facets,
): any {
  input = input || {}

  const perPage = input.per_page || 12
  const page = input.page || 1
  const isAllFilteredItems = input.is_all_filtered_items || false

  if (configuration.native_search_enabled === false && input.filter) {
    throw new Error(
      '"query" and "filter" options are not working once native search is disabled',
    )
  }

  let queryIds
  // all ids bitmap
  let filteredIndexesBitmap = facets.bits_ids()
  let ids
  let allFilteredItems

  if (input._ids) {
    queryIds = new BitSet(input._ids)
    ids = input._ids
  } else if (input.ids) {
    ids = facets.internal_ids_from_ids_map(input.ids)
    //console.log(_ids);
    queryIds = new BitSet(ids)
  }

  const facetResult = facets.search(input, {
    query_ids: queryIds,
  })

  if (queryIds) {
    filteredIndexesBitmap = queryIds
  }

  if (facetResult.ids) {
    filteredIndexesBitmap = filteredIndexesBitmap.and(facetResult.ids)
  }

  if (facetResult.not_ids) {
    filteredIndexesBitmap = filteredIndexesBitmap.and(facetResult.not_ids)
  }

  // new filters to items
  // -------------------------------------
  let filteredIndices = filteredIndexesBitmap.toArray()

  let filteredItems = filteredIndices.map((_id) => {
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
      filteredIndices = ids.filter((v) => {
        return filteredIndexesBitmap.has(v)
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
    allFilteredItems = isAllFilteredItems ? filteredItems : null
    filteredItems = filteredItems.slice((page - 1) * perPage, page * perPage)
  }

  return {
    data: {
      //aggregations: aggregations,
      aggregations: getBuckets(facetResult, input, configuration.aggregations),

      allFilteredItems: allFilteredItems,

      items: filteredItems,
    },
    pagination: {
      page: page,
      per_page: perPage,
      total: filteredIndices.length,
    },
  }
}

/**
 * return items by sort
 */
export function sortItems(items, sort, sortings) {
  if (sortings && sortings[sort]) {
    sort = sortings[sort]
  }

  if (sort.field) {
    return orderBy(items, sort.field, sort.order || "asc")
  }

  return items
}
