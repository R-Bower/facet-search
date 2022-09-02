import {aggregation} from "./aggregation"
import {Facets} from "./facets"
import {mergeAggregations} from "./helpers"
import {search} from "./search"
import {
  Aggregation,
  AggregationOptions,
  AggregationResult,
  Configuration,
  Item,
  SearchInput,
} from "./types"

export class FacetSearch<I extends Item, S extends string, A extends string> {
  private readonly configuration: Configuration<I, S, A>
  private readonly facets: Facets<I, S, A>

  constructor(items: I[], configuration: Configuration<I, S, A>) {
    this.configuration = configuration
    // "index" the items, which constructs the facets from every item.
    this.facets = new Facets(items, configuration)
  }

  aggregation(options: AggregationOptions<A>): AggregationResult<I> {
    return aggregation(options, this.configuration, this.facets)
  }

  search(input: SearchInput<I, S, A> = {}) {
    return search(
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
