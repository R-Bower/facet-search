import {clone} from "lodash-es"

import {Facets} from "./facets"
import {search} from "./search"
import {Aggregation, AggregationOptions, Configuration} from "./types"

/**
 * returns list of elements in specific facet
 * useful for autocomplete or list all aggregation options
 */
export function aggregation<
  I extends Record<string, unknown>,
  S extends string,
  A extends string,
>(
  items: I[],
  options: AggregationOptions<A>,
  configuration: Configuration<I, S, A>,
  facets: Facets<I, S, A>,
) {
  const perPage = options.per_page || 10
  const page = options.page || 1

  if (
    options.name &&
    (!configuration.aggregations || !configuration.aggregations[options.name])
  ) {
    throw new Error(
      'Please define aggregation "'.concat(options.name, '" in config'),
    )
  }

  const searchInput = clone(options)

  searchInput.page = 1
  searchInput.per_page = 0

  if (!options.name) {
    throw new Error("field name is required")
  }

  if (!configuration.aggregations) {
    configuration.aggregations = {} as Record<A, Aggregation>
  }

  configuration.aggregations[options.name].size = 10000

  const result = search(items, searchInput, configuration, facets)
  const buckets = result.data.aggregations[options.name].buckets

  return {
    data: {
      buckets: buckets.slice((page - 1) * perPage, page * perPage),
    },
    pagination: {
      page,
      per_page: perPage,
      total: buckets.length,
    },
  }
}
