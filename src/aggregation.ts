import {clone} from "lodash-es"

import {Facets} from "./facets"
import {search} from "./search"
import {
  AggregationOptions,
  AggregationResult,
  Configuration,
  Item,
} from "./types"

/**
 * returns list of elements in specific facet
 * useful for autocomplete or list all aggregation options
 */
export function aggregation<I extends Item, S extends string>(
  options: AggregationOptions,
  configuration: Configuration<I, S>,
  facets: Facets<I, S>,
): AggregationResult<I> {
  const perPage = options.perPage || 10
  const page = options.page || 1

  if (
    options.name &&
    (!configuration.aggregations || !configuration.aggregations[options.name])
  ) {
    throw new Error(`aggregation "${options.name}" is missing from config`)
  }

  const searchInput = clone(options)

  searchInput.page = 1
  searchInput.perPage = 0

  if (!options.name) {
    throw new Error("field name is required")
  }

  if (!configuration.aggregations) {
    configuration.aggregations = {}
  }

  configuration.aggregations[options.name].size = 10000

  const result = search(searchInput, configuration, facets)
  const buckets = result.data.aggregations[options.name].buckets

  return {
    data: {
      buckets: buckets.slice((page - 1) * perPage, page * perPage),
    },
    pagination: {
      page,
      perPage,
      total: buckets.length,
    },
  }
}
