import {chain, mapValues, orderBy} from "lodash-es"

import {Aggregation, Buckets, FacetData, Item, Order} from "./types"

export function getBuckets<I extends Item>(
  data: FacetData,
  input: Partial<Record<string | number, Array<string | number>>>,
  aggregations: Record<string, Aggregation> = {} as any,
): Record<string, {buckets: Buckets<I>; name: string; position: number}> {
  let position = 1

  return mapValues(data.bits_data_temp, (v, k: string) => {
    let order
    let sort
    let size
    let chosenFiltersOnTop = false
    let hideZeroDocCount = false

    if (aggregations[k]) {
      order = aggregations[k].order
      sort = aggregations[k].sort
      size = aggregations[k].size
      chosenFiltersOnTop = aggregations[k].chosenFiltersOnTop !== false
      hideZeroDocCount = aggregations[k].hideZeroDocCount || false
    }

    const buckets: Buckets<I> = chain(v)
      .toPairs()
      .map((v2) => {
        let filters = []

        if (input && input.filters && k in input.filters) {
          filters = input.filters[k]
        }

        const doc_count = v2[1].toArray().length

        if (hideZeroDocCount && doc_count === 0) {
          return
        }

        return {
          doc_count,
          key: v2[0],
          selected: filters.indexOf(v2[0]) !== -1,
        }
      })
      .compact()
      .value()

    let iteratees
    let sortOrder: Order[]

    if (Array.isArray(sort)) {
      iteratees = sort || ["key"]
      sortOrder = order || ["asc"]
    } else {
      if (sort === "term" || sort === "key") {
        iteratees = ["key"]
        sortOrder = [order || "asc"]
      } else {
        iteratees = ["doc_count", "key"]
        sortOrder = [order || "desc", "asc"]
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
