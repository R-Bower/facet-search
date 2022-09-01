import BitSet from "typedfastbitset"
import {clone, mapValues} from "lodash-es"

import {
  facets_ids,
  filterIds,
  index,
  inputToFacetFilters,
  matrix,
} from "./helpers"
import {Aggregation, Configuration} from "./types"

/**
 * responsible for making faceted search
 */
export class Facets<
  I extends Record<string, unknown>,
  S extends string,
  A extends string,
> {
  config: Record<A, Aggregation>
  facets: any
  _items_map: any
  _ids: any
  ids_map: any
  _bits_ids: BitSet

  constructor(items, configuration: Configuration<I, S, A> = {}) {
    configuration = configuration || {}
    configuration.aggregations =
      configuration.aggregations || ({} as Record<A, Aggregation>)
    this.items = items
    this.config = configuration.aggregations
    this.facets = index(items, Object.keys(this.config))

    this._items_map = {}
    this._ids = []

    let i = 1
    items.map((item) => {
      this._ids.push(i)
      this._items_map[i] = item
      item._id = i
      ++i
    })

    this.ids_map = {}

    if (items) {
      items.forEach((v) => {
        if (v.id && v._id) {
          this.ids_map[v.id] = v._id
        }
      })
    }

    this._bits_ids = new BitSet(this._ids)
  }

  bits_ids(ids) {
    if (ids) {
      return new BitSet(ids)
    }
    return this._bits_ids
  }

  get_item(_id) {
    return this._items_map[_id]
  }

  index() {
    return this.facets
  }

  internal_ids_from_ids_map(ids) {
    return ids.map((v) => {
      return this.ids_map[v]
    })
  }

  items() {
    return this.items
  }

  /*
   *
   * ids is optional only when there is query
   */
  search(input, data) {
    const config = this.config
    data = data || {}

    // consider removing clone
    const temp_facet = clone(this.facets)

    temp_facet.not_ids = facets_ids(temp_facet["bits_data"], input.not_filters)

    const filters = inputToFacetFilters(input, config)
    const temp_data = matrix(this.facets, filters)

    temp_facet["bits_data_temp"] = temp_data["bits_data_temp"]

    mapValues(temp_facet["bits_data_temp"], function (values, key) {
      mapValues(
        temp_facet["bits_data_temp"][key],
        function (facet_indexes, key2) {
          if (data.query_ids) {
            temp_facet["bits_data_temp"][key][key2] = data.query_ids.and(
              temp_facet["bits_data_temp"][key][key2],
            )
          }

          if (data.test) {
            temp_facet["data"][key][key2] =
              temp_facet["bits_data_temp"][key][key2].toArray()
          }
        },
      )
    })

    /**
     * calculating ids (for a list of items)
     * facets ids is faster and filter ids because filter ids makes union each to each filters
     * filter ids needs to be used if there is filters query
     */
    if (input.filters_query) {
      temp_facet.ids = filterIds(temp_facet["bits_data_temp"])
    } else {
      temp_facet.ids = facets_ids(temp_facet["bits_data_temp"], input.filters)
    }

    return temp_facet
  }
}
