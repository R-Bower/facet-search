import BitSet from "bitset"
import {chain, clone, get, mapValues, orderBy, sortBy} from "lodash-es"

import {
  Aggregation,
  BitDataMap,
  BitSetDataMap,
  FacetData,
  FilterValue,
  IndexFieldsResult,
  Item,
  SearchInput,
  Sorting,
} from "./types"

export function combinationIndices(facets: FacetData, filters: any) {
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
        facetUnion = facetUnion.or(facets.bitsData[filterKey][filterVal])
        indices[filterKey] = facetUnion
      })
    }
  })

  return indices
}

/*
 * returns facets and ids
 */
export function matrix(
  facets: FacetData & {is_temp_copied?: boolean},
  filters: any[] = [],
): FacetData {
  const tempFacet = clone(facets)

  mapValues(tempFacet.bitsData, (values, key) => {
    mapValues(tempFacet.bitsData[key], (facetIndices, key2) => {
      tempFacet.bitsDataTemp[key][key2] = tempFacet.bitsData[key][key2]
    })
  })

  tempFacet.is_temp_copied = true

  let conjunctiveIndex: BitSet
  const disjunctiveIndices = combinationIndices(facets, filters)

  /**
   * process only conjunctive filters
   */
  mapValues(filters, function (filter) {
    if (!Array.isArray(filter[0])) {
      const filterKey = filter[0]
      const filterVal = filter[1]

      if (conjunctiveIndex && tempFacet.bitsDataTemp[filterKey][filterVal]) {
        conjunctiveIndex =
          tempFacet.bitsDataTemp[filterKey][filterVal].and(conjunctiveIndex)
      } else if (
        conjunctiveIndex &&
        !tempFacet.bitsDataTemp[filterKey][filterVal]
      ) {
        conjunctiveIndex = new BitSet([])
      } else {
        conjunctiveIndex = tempFacet.bitsDataTemp[filterKey][filterVal]
      }
    }
  })

  // cross all facets with conjunctive index
  // @ts-expect-error the compiler doesn't evaluate the inner functions of
  // mapValues in the block above?
  if (conjunctiveIndex) {
    mapValues(tempFacet.bitsDataTemp, (values, key) => {
      mapValues(tempFacet.bitsDataTemp[key], (facetIndices, key2) => {
        tempFacet.bitsDataTemp[key][key2] =
          tempFacet.bitsDataTemp[key][key2].and(conjunctiveIndex)
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

      const negative_bits = tempFacet.bitsDataTemp[filterKey][filterVal].clone()

      mapValues(tempFacet.bitsDataTemp, (values, key) => {
        mapValues(tempFacet.bitsDataTemp[key], (facetIndices, key2) => {
          tempFacet.bitsDataTemp[key][key2] =
            tempFacet.bitsDataTemp[key][key2].andNot(negative_bits)
        })
      })
    }
  })

  // cross all facets with disjunctive index
  mapValues(tempFacet.bitsDataTemp, (values, key) => {
    mapValues(tempFacet.bitsDataTemp[key], (facetIndices, key2) => {
      mapValues(disjunctiveIndices, (disjunctiveIndex, disjunctiveKey) => {
        if (disjunctiveKey !== key) {
          tempFacet.bitsDataTemp[key][key2] =
            tempFacet.bitsDataTemp[key][key2].and(disjunctiveIndex)
        }
      })
    })
  })

  return tempFacet
}

export function indexFields<I extends Item>(
  items: I[],
  fields: string[],
): IndexFieldsResult<I> {
  fields = fields || []

  const ids: number[] = []
  const itemsMap: Record<number, I & {_id: number}> = {}

  const facets: FacetData = {
    bitsData: {} as BitSetDataMap,
    bitsDataTemp: {} as BitSetDataMap,
    data: {} as BitDataMap,
  }

  let i = 1
  const indexedItems: Array<I & {_id: number}> = chain(items)
    .map((originalItem: I) => {
      // add _id
      const item = {...originalItem, _id: i}
      ids.push(i)
      itemsMap[i] = item
      ++i
      fields.forEach((field: string) => {
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
    if (!facets.bitsData[field]) {
      facets.bitsData[field] = {}
      facets.bitsDataTemp[field] = {}
    }

    return mapValues(values, function (indexes, filter) {
      const sortedIndices = sortBy(indexes)
      facets.bitsData[field][filter] = new BitSet(sortedIndices)
      return sortedIndices
    })
  })

  return {facets, ids, indexedItems, itemsMap}
}

/**
 * calculates ids for facets
 * if there is no facet input then return null to not save resources for OR calculation
 * null means facets haven't matched searched items
 */
export function facetIds(
  facetData: BitSetDataMap,
  inputFilters: Record<string, FilterValue>,
): BitSet | undefined {
  let output = new BitSet([])
  let i = 0

  mapValues(inputFilters, function (filters, field) {
    if (filters) {
      filters.forEach((filter) => {
        ++i
        output = output.or(facetData[field][filter])
      })
    }
  })

  if (i === 0) {
    return
  }

  return output
}

export function mergeAggregations<A extends string>(
  aggregations: Record<A, Aggregation>,
  inputFilters?: Record<string, FilterValue>,
) {
  return mapValues(clone(aggregations), (val, key) => {
    if (!val.field) {
      val.field = key
    }

    let filters: FilterValue = []
    if (inputFilters && inputFilters[key]) {
      filters = inputFilters[key]
    }

    val.filters = filters

    return val
  })
}

export function inputToFacetFilters<
  I extends Item,
  S extends string,
  A extends string,
>(input: SearchInput<I, S, A>, config: Record<string, Aggregation>) {
  const filters: any[] = []

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

export function ensureArray<K>(field: K | K[]): K[] {
  return Array.isArray(field) ? field : [field]
}

/**
 * return items by sort
 */
export function sortItems<I extends Item, S extends string>(
  items: I[],
  sort: S | Sorting<I>,
  sortings?: Record<S, Sorting<I>>,
): I[] {
  if (typeof sort === "string" && sortings && sortings[sort]) {
    sort = sortings[sort]
  }

  if (typeof sort !== "string" && sort.field) {
    return orderBy(items, sort.field, sort.order || "asc")
  }

  return items
}
