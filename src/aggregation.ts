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
  facets: Facets<I, S>,
  options: AggregationOptions,
  configuration: Configuration<I, S>,
): AggregationResult<I> {
  const perPage = options.perPage || 10
  const page = options.page || 1

  if (
    options.name &&
    (!configuration.filterFields || !configuration.filterFields[options.name])
  ) {
    throw new Error(`filterField "${options.name}" is missing from config`)
  }

  const searchInput = clone(options)

  searchInput.page = 1
  searchInput.perPage = 0

  if (!options.name) {
    throw new Error("field name is required")
  }

  if (!configuration.filterFields) {
    configuration.filterFields = {}
  }

  configuration.filterFields[options.name].size = 10000

  const result = search(facets, searchInput, configuration)
  const buckets = result.data.facets[options.name].buckets

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
