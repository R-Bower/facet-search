import {chain, mapValues, orderBy} from "lodash-es"

import {ensureArray} from "./helpers"
import {
  Aggregation,
  Buckets,
  FacetData,
  FilterValue,
  Item,
  Order,
} from "./types"

export function getBuckets<I extends Item>(
  data: FacetData,
  inputFilters: Record<string, FilterValue>,
  aggregations: Record<string, Aggregation> = {},
): Record<string, {buckets: Buckets<I>; name: string; position: number}> {
  let position = 1

  return mapValues(data.bitsDataTemp, (v, k: string) => {
    let order, sort, size
    let chosenFiltersOnTop, hideZeroDocCount: boolean

    if (aggregations[k]) {
      order = aggregations[k].order
      sort = aggregations[k].sort
      size = aggregations[k].size
      chosenFiltersOnTop = aggregations[k].chosenFiltersOnTop !== false
      hideZeroDocCount = aggregations[k].hideZeroDocCount || false
    }

    const buckets: Buckets<I> = chain(v)
      .toPairs()
      .map(([key, bitset]) => {
        let filters: FilterValue = []

        if (inputFilters[k]) {
          filters = inputFilters[k]
        }

        const docCount = bitset.toArray().length

        if (hideZeroDocCount && docCount === 0) {
          return
        }

        return {
          docCount,
          key,
          selected: filters.indexOf(key) !== -1,
        }
      })
      .compact()
      .value()

    let iteratees
    let sortOrder: Order[]

    if (Array.isArray(sort)) {
      iteratees = sort || ["key"]
      sortOrder = order ? ensureArray(order) : ["asc"]
    } else {
      if (sort === "term" || sort === "key") {
        iteratees = ["key"]
        sortOrder = order ? ensureArray(order) : ["asc"]
      } else {
        iteratees = ["docCount", "key"]
        sortOrder = order ? [...ensureArray(order), "asc"] : ["desc", "asc"]
      }

      if (chosenFiltersOnTop) {
        iteratees.unshift("selected")
        sortOrder.unshift("desc")
      }
    }

    return {
      buckets: orderBy<Buckets<I>>(buckets, iteratees, sortOrder).slice(
        0,
        size || 10,
      ) as Buckets<I>,
      name: k,
      position: position++,
    }
  })
}
