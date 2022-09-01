import {chain, isArray, mapValues, orderBy} from "lodash-es"

import {Buckets} from "./types"

export function getBuckets<I extends Record<string, unknown>>(
  data: I[],
  input,
  aggregations,
): Record<string, {buckets: Buckets<I>; name: string; position: number}> {
  let position = 1

  return mapValues(data["bits_data_temp"], (v, k) => {
    let order
    let sort
    let size
    let chosen_filters_on_top
    let hide_zero_doc_count

    if (aggregations[k]) {
      order = aggregations[k].order
      sort = aggregations[k].sort
      size = aggregations[k].size
      chosen_filters_on_top = aggregations[k].chosen_filters_on_top !== false
      hide_zero_doc_count = aggregations[k].hide_zero_doc_count || false
    }

    let buckets = chain(v)
      .toPairs()
      .map((v2) => {
        let filters = []

        if (input && input.filters && input.filters[k]) {
          filters = input.filters[k]
        }

        const doc_count = v2[1].toArray().length

        if (hide_zero_doc_count && doc_count === 0) {
          return
        }

        return {
          doc_count: doc_count,
          key: v2[0],
          selected: filters.indexOf(v2[0]) !== -1,
        }
      })
      .compact()
      .value()

    let iteratees
    let sort_order

    if (isArray(sort)) {
      iteratees = sort || ["key"]
      sort_order = order || ["asc"]
    } else {
      if (sort === "term" || sort === "key") {
        iteratees = ["key"]
        sort_order = [order || "asc"]
      } else {
        iteratees = ["doc_count", "key"]
        sort_order = [order || "desc", "asc"]
      }

      if (chosen_filters_on_top) {
        iteratees.unshift("selected")
        sort_order.unshift("desc")
      }
    }

    buckets = orderBy(buckets, iteratees, sort_order)

    buckets = buckets.slice(0, size || 10)

    // Calculate the facet_stats

    return {
      buckets: buckets,
      name: k,
      position: position++,
    }
  })
}
