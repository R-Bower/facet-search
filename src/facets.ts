import BitSet from "bitset"
import {clone, mapValues} from "lodash"

import {facetIds, indexFields, inputToFacetFilters, matrix} from "./helpers"
import {
  Aggregation,
  Configuration,
  FacetData,
  Item,
  SearchOptions,
} from "./types"

/**
 * responsible for making faceted search
 */
export class Facets<I extends Item, S extends string, A extends string> {
  config: Record<A, Aggregation>
  facets: FacetData
  items: I[]
  _items_map: Record<number, I>
  _ids: number[]
  ids_map: Record<string, number>
  _bits_ids: BitSet

  constructor(items: I[], configuration: Configuration<I, S, A> = {}) {
    configuration = configuration || {}
    configuration.aggregations =
      configuration.aggregations || ({} as Record<A, Aggregation>)
    this.items = items
    this.config = configuration.aggregations
    this.facets = indexFields(items, Object.keys(this.config))

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
      items.forEach((v: Item & {id?: string}) => {
        if (v.id && v._id) {
          this.ids_map[v.id] = v._id
        }
      })
    }

    this._bits_ids = new BitSet(this._ids)
  }

  bits_ids(ids?: number[]) {
    if (ids) {
      return new BitSet(ids)
    }
    return this._bits_ids
  }

  get_item(_id: number) {
    return this._items_map[_id]
  }

  internal_ids_from_ids_map(ids: number[]) {
    return ids.map((v) => {
      return this.ids_map[v]
    })
  }

  /*
   *
   * ids is optional only when there is query
   */
  search(input: SearchOptions<I, S, A>, data: {queryIds?: BitSet} = {}) {
    const config = this.config

    // consider removing clone
    const tempFacet = clone(this.facets)

    const filters = inputToFacetFilters(input, config)
    const temp_data = matrix(this.facets, filters)

    tempFacet.bitsDataTemp = temp_data.bitsDataTemp

    if (data.queryIds) {
      mapValues(tempFacet.bitsDataTemp, (values, key) => {
        mapValues(tempFacet.bitsDataTemp[key], (facet_indexes, key2) => {
          // @ts-expect-error TS not properly detecting that queryIds is defined
          tempFacet.bitsDataTemp[key][key2] = data.queryIds.and(
            tempFacet.bitsDataTemp[key][key2],
          )
        })
      })
    }

    // calculating ids (for a list of items)
    tempFacet.ids = facetIds(tempFacet.bitsDataTemp, input.filters ?? {})

    return tempFacet
  }
}
