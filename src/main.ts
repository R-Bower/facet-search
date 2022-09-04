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

export class FacetSearch<I extends Item> {
  private readonly configuration: Configuration
  private readonly facets: Facets<I>

  constructor(items: I[], configuration: Configuration) {
    this.configuration = configuration
    // "index" the items, which constructs the facets from every item.
    this.facets = new Facets(items, configuration)
  }

  aggregation(options: AggregationOptions): AggregationResult<I> {
    return aggregation(this.facets, options, this.configuration)
  }

  search(input: SearchInput = {}) {
    return search(
      this.facets,
      {
        ...input,
        filterConfig: mergeAggregations(
          this.configuration.filterFields ?? {},
          input.filters,
        ),
      },
      this.configuration,
    )
  }
}
