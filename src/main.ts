import {aggregation} from "./aggregation"
import {Facets} from "./facets"
import {mergeAggregations} from "./helpers"
import {search} from "./search"
import {
  Aggregation,
  AggregationOptions,
  Buckets,
  Configuration,
  Pagination,
  SearchOptions,
} from "./types"

export class FacetSearch<
  I extends Record<string, unknown>,
  S extends string,
  A extends string,
> {
  items: I[]
  configuration: Configuration<I, S, A>
  facets: Facets<I, S, A>

  constructor(items: I[], configuration: Configuration<I, S, A>) {
    this.items = items
    this.configuration = configuration
    // index facets
    this.facets = new Facets(items, configuration)
  }

  aggregation(options: AggregationOptions<A>): {
    data: {buckets: Buckets<I>}
    pagination: Pagination
  } {
    return aggregation(this.items, options, this.configuration, this.facets)
  }

  search(input: SearchOptions<I, S, A> = {}) {
    return search(
      this.items,
      {
        ...input,
        aggregations: mergeAggregations(
          this.configuration.aggregations ?? ({} as Record<A, Aggregation>),
          input.filters,
        ),
      },
      this.configuration,
      this.facets,
    )
  }
}
