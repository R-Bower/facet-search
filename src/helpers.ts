import BitSet from "bitset"
import {clone, get, mapValues, orderBy} from "lodash"

import {
  BitSetDataMap,
  FacetData,
  FilterConfig,
  FilterValue,
  Item,
  SearchInput,
  SortConfig,
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
        conjunctiveIndex = get(tempFacet.bitsDataTemp, filterKey)[filterVal]
      }
    }
  })

  // cross all facets with conjunctive index
  // @ts-ignore the compiler doesn't evaluate the inner functions of mapValues in the block above?
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

/**
 * calculates ids for facets
 * if there is no facet input then return null to not save resources for OR calculation
 * null means facets haven't matched searched items
 */
export function facetIds(
  facetData: BitSetDataMap,
  inputFilters: Record<string, FilterValue>,
  filterFields: Record<string, FilterConfig>,
): BitSet | undefined {
  let output = new BitSet([])
  let i = 0

  mapValues(inputFilters, (filterValues, key) => {
    if (filterValues) {
      filterValues.forEach((filter) => {
        ++i
        const filterConfig = filterFields[key]
        const targetField = get(facetData, filterConfig?.field || key)

        if (!targetField) {
          throw new Error(
            "Missing field for filter.  Did you forget to include it in the filterFields config?",
          )
        }
        output = output.or(targetField[filter])
      })
    }
  })

  if (i === 0) {
    return
  }

  return output
}

export function mergeFilterConfigs<A extends string>(
  aggregations: Record<A, FilterConfig>,
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

export function inputToFacetFilters(
  input: SearchInput,
  config: Record<string, FilterConfig>,
) {
  const filters: any[] = []

  mapValues(input.filters, function (values, key) {
    if (values && values.length) {
      const configFilter = get(config, key)
      if (!configFilter) {
        console.error("Field not found, check key", key)
        return
      }
      const field = configFilter.field ?? key
      if (configFilter.and !== false) {
        mapValues(values, (values2) => {
          filters.push([field, values2])
        })
      } else {
        const temp: [string, any][] = []
        mapValues(values, (values2) => {
          temp.push([field, values2])
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
  sort: SortConfig,
  sortings?: Record<S, SortConfig>,
): I[] {
  if (typeof sort === "string" && sortings && sortings[sort]) {
    sort = sortings[sort]
  }

  if (typeof sort !== "string" && sort.field) {
    return orderBy(items, sort.field, sort.order || "asc")
  }

  return items
}
