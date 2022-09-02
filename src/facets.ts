import BitSet from "bitset"
import {clone, mapValues} from "lodash-es"

import {facetIds, indexFields, inputToFacetFilters, matrix} from "./helpers"
import {Aggregation, Configuration, FacetData, Item, SearchInput} from "./types"

/**
 * responsible for making faceted search
 */
export class Facets<I extends Item, S extends string> {
  private readonly config: Record<string, Aggregation>
  private readonly facets: FacetData
  private readonly itemsMap: Record<number, I & {_id: number}>
  private readonly items: Array<I & {_id: number}>
  private readonly idsMap: Record<string, number>
  private readonly bitsIds: BitSet

  constructor(items: I[], configuration: Configuration<I, S> = {}) {
    configuration = configuration || {}
    configuration.aggregations =
      configuration.aggregations || ({} as Record<string, Aggregation>)
    this.config = configuration.aggregations
    const {facets, ids, indexedItems, itemsMap} = indexFields(
      items,
      Object.keys(this.config),
    )
    this.items = indexedItems
    this.facets = facets
    this.itemsMap = itemsMap

    this.idsMap = {}
    if (this.items.length) {
      this.items.forEach((v: Item & {id?: string}) => {
        if (v.id && v._id) {
          this.idsMap[v.id] = v._id
        }
      })
    }

    this.bitsIds = new BitSet(ids)
  }

  getBitIds() {
    return this.bitsIds
  }

  getItems(): Array<I & {_id: number}> {
    return this.items
  }

  getItem(_id: number) {
    return this.itemsMap[_id]
  }

  /*
   *
   * ids is optional only when there is query
   */
  search(input: SearchInput<I, S>, data: {queryIds?: BitSet} = {}) {
    const config = this.config

    // consider removing clone
    const tempFacet = clone(this.facets)

    const filters = inputToFacetFilters(input, config)
    const tempData = matrix(this.facets, filters)

    tempFacet.bitsDataTemp = tempData.bitsDataTemp

    if (data.queryIds) {
      mapValues(tempFacet.bitsDataTemp, (values, key) => {
        mapValues(tempFacet.bitsDataTemp[key], (facet_indexes, key2) => {
          // @ts-ignore TS not properly detecting that queryIds is defined
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
