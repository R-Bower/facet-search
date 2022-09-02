import BitSet from "bitset"
import {chain, clone, get, map, mapValues, sortBy} from "lodash-es"

import {
  Aggregation,
  BitDataMap,
  BitSetDataMap,
  FacetData,
  Item,
  SearchOptions,
} from "./types"

export const combinationIndices = function (facets: FacetData, filters) {
  const indices: Record<string, BitSet> = {}

  mapValues(filters, (filter) => {
    // filter is still array so disjunctive
    if (Array.isArray(filter[0])) {
      let facetUnion = new BitSet([])
      const filterKeys = []

      mapValues(filter, (disjunctiveFilter) => {
        const filterKey = disjunctiveFilter[0]
        const filterVal = disjunctiveFilter[1]

        filterKeys.push(filterKey)
        facetUnion = facetUnion.or(facets.bits_data[filterKey][filterVal])
        indices[filterKey] = facetUnion
      })
    }
  })

  return indices
}

/*
 * returns facets and ids
 */
export const matrix = (
  facets: FacetData & {is_temp_copied?: boolean},
  filters: any[] = [],
) => {
  const tempFacet = clone(facets)

  mapValues(tempFacet.bits_data, (values, key) => {
    mapValues(tempFacet.bits_data[key], (facetIndices, key2) => {
      tempFacet.bits_data_temp[key][key2] = tempFacet["bits_data"][key][key2]
    })
  })

  tempFacet.is_temp_copied = true

  let conjunctiveIndex: any
  const disjunctiveIndices = combinationIndices(facets, filters)

  /**
   * process only conjunctive filters
   */
  mapValues(filters, function (filter) {
    if (!Array.isArray(filter[0])) {
      const filterKey = filter[0]
      const filterVal = filter[1]

      if (conjunctiveIndex && tempFacet.bits_data_temp[filterKey][filterVal]) {
        conjunctiveIndex =
          tempFacet.bits_data_temp[filterKey][filterVal].and(conjunctiveIndex)
      } else if (
        conjunctiveIndex &&
        !tempFacet.bits_data_temp[filterKey][filterVal]
      ) {
        conjunctiveIndex = new BitSet([])
      } else {
        conjunctiveIndex = tempFacet.bits_data_temp[filterKey][filterVal]
      }
    }
  })

  // cross all facets with conjunctive index
  if (conjunctiveIndex) {
    mapValues(tempFacet.bits_data_temp, (values, key) => {
      mapValues(tempFacet.bits_data_temp[key], (facetIndices, key2) => {
        tempFacet.bits_data_temp[key][key2] =
          tempFacet.bits_data_temp[key][key2].and(conjunctiveIndex)
      })
    })
  }

  /**
   * process only negative filters
   */
  mapValues(filters, (filter) => {
    if (filter.length === 3 && filter[1] === "-") {
      const filterKey = filter[0]
      const filterVal = filter[2]

      const negative_bits =
        tempFacet.bits_data_temp[filterKey][filterVal].clone()

      mapValues(tempFacet.bits_data_temp, (values, key) => {
        mapValues(tempFacet.bits_data_temp[key], (facetIndices, key2) => {
          tempFacet.bits_data_temp[key][key2] =
            tempFacet.bits_data_temp[key][key2].andNot(negative_bits)
        })
      })
    }
  })

  // cross all facets with disjunctive index
  mapValues(tempFacet.bits_data_temp, (values, key) => {
    mapValues(tempFacet.bits_data_temp[key], (facetIndices, key2) => {
      mapValues(disjunctiveIndices, (disjunctiveIndex, disjunctiveKey) => {
        if (disjunctiveKey !== key) {
          tempFacet.bits_data_temp[key][key2] =
            tempFacet.bits_data_temp[key][key2].and(disjunctiveIndex)
        }
      })
    })
  })

  return tempFacet
}

export function indexFields<I extends Item>(
  items: I[],
  fields: string[],
): {
  bits_data: BitSetDataMap
  bits_data_temp: BitSetDataMap
  data: BitDataMap
} {
  fields = fields || []

  const facets = {
    bits_data: {} as BitSetDataMap,
    bits_data_temp: {} as BitSetDataMap,
    data: {} as BitDataMap,
  }

  let i = 1

  items = map(items, (item) => {
    if (!item["_id"]) {
      item["_id"] = i
      ++i
    }

    return item
  })

  // replace chain with forEach

  chain(items)
    .map((item: Item) => {
      fields.forEach((field: string) => {
        if (!item || !item._id) {
          return
        }

        if (!facets.data[field]) {
          facets.data[field] = {}
        }

        // TODO: check to see how match-sorter does this
        const fieldValue: any = get(item, field)

        if (Array.isArray(fieldValue)) {
          fieldValue.forEach((v) => {
            if (Array.isArray(v)) {
              console.debug("Tuples aren't supported yet")
              return
            }

            if (typeof v === "object") {
              console.debug("Nested properties aren't supported yet")
              return
            }

            if (!facets.data[field][v]) {
              facets.data[field][v] = []
            }

            // @ts-expect-error item._id is not detected properly
            facets.data[field][v].push(item._id)
          })
        } else {
          if (!facets.data[field][fieldValue]) {
            facets.data[field][fieldValue] = []
          }

          facets.data[field][fieldValue].push(item._id)
        }
      })

      return item
    })
    .value()

  facets.data = mapValues(facets.data, function (values, field) {
    if (!facets.bits_data[field]) {
      facets.bits_data[field] = {}
      facets.bits_data_temp[field] = {}
    }

    return mapValues(values, function (indexes, filter) {
      const sortedIndices = sortBy(indexes)
      facets.bits_data[field][filter] = new BitSet(sortedIndices)
      return sortedIndices
    })
  })

  return facets
}

/**
 * calculates ids for facets
 * if there is no facet input then return null to not save resources for OR calculation
 * null means facets haven't matched searched items
 */
export function facetIds<A extends string>(
  facetData: BitSetDataMap,
  filters: Partial<Record<A, Array<string | number>>>,
): BitSet | undefined {
  let output = new BitSet([])
  let i = 0

  mapValues(filters, function (filters, field) {
    filters.forEach((filter) => {
      ++i
      output = output.or(facetData[field][filter])
    })
  })

  if (i === 0) {
    return
  }

  return output
}

export function mergeAggregations<
  I extends Item,
  S extends string,
  A extends string,
>(aggregations: Record<A, Aggregation>, input: SearchOptions<I, S, A>) {
  return mapValues(clone(aggregations), (val, key) => {
    if (!val.field) {
      val.field = key
    }

    let filters = []
    if (input.filters && input.filters[key]) {
      filters = input.filters[key]
    }

    val.filters = filters

    return val
  })
}

export function inputToFacetFilters(input, config) {
  const filters: [string, any][] = []

  mapValues(input.filters, function (values, key) {
    if (values && values.length) {
      if (config[key].conjunction !== false) {
        mapValues(values, (values2) => {
          filters.push([key, values2])
        })
      } else {
        const temp: [string, any][] = []
        mapValues(values, (values2) => {
          temp.push([key, values2])
        })

        filters.push(temp)
      }
    }
  })

  return filters
}
