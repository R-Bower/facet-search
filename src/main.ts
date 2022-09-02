import {aggregation} from "./aggregation"
import {Facets} from "./facets"
import {mergeAggregations} from "./helpers"
import {search} from "./search"
import {
  AggregationOptions,
  AggregationResult,
  Configuration,
  Item,
  SearchInput,
} from "./types"

export class FacetSearch<I extends Item, S extends string> {
  private readonly configuration: Configuration<I, S>
  private readonly facets: Facets<I, S>

  constructor(items: I[], configuration: Configuration<I, S>) {
    this.configuration = configuration
    // "index" the items, which constructs the facets from every item.
    this.facets = new Facets(items, configuration)
  }

  aggregation(options: AggregationOptions): AggregationResult<I> {
    return aggregation(options, this.configuration, this.facets)
  }

  search(input: SearchInput<I, S> = {}) {
    return search(
      {
        ...input,
        aggregations: mergeAggregations(
          this.configuration.aggregations ?? {},
          input.filters,
        ),
      },
      this.configuration,
      this.facets,
    )
  }
}
