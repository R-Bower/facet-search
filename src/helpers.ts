import BitSet from "bitset"
import {chain, clone, map, mapValues, sortBy} from "lodash-es"

export const combinationIndices = function (facets, filters) {
  const indices = {}

  mapValues(filters, function (filter) {
    // filter is still array so disjunctive
    if (Array.isArray(filter[0])) {
      let facet_union = new BitSet([])
      const filterKeys = []

      mapValues(filter, function (disjunctiveFilter) {
        const filterKey = disjunctiveFilter[0]
        const filterVal = disjunctiveFilter[1]

        filterKeys.push(filterKey)
        facet_union = facet_union.or(facets["bits_data"][filterKey][filterVal])
        indices[filterKey] = facet_union
      })
    }
  })

  return indices
}

/*
 * returns facets and ids
 */
export const matrix = function (facets, filters) {
  const tempFacet = clone(facets)

  filters = filters || []

  mapValues(tempFacet.bits_data, (values, key) => {
    mapValues(tempFacet.bits_data[key], (facetIndices, key2) => {
      tempFacet.bits_data_temp[key][key2] = tempFacet["bits_data"][key][key2]
    })
  })

  tempFacet.is_temp_copied = true

  let conjunctiveIndex
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

export function index(items, fields) {
  fields = fields || []

  const facets = {
    bits_data: {},
    bits_data_temp: {},
    data: {},
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
    .map((item) => {
      fields.forEach((field) => {
        //if (!item || !item[field]) {
        if (!item) {
          return
        }

        if (!facets["data"][field]) {
          facets["data"][field] = {}
        }

        if (Array.isArray(item[field])) {
          item[field].forEach((v) => {
            if (!item[field]) {
              return
            }

            if (!facets["data"][field][v]) {
              facets["data"][field][v] = []
            }

            facets["data"][field][v].push(parseInt(item._id))
          })
        } else if (typeof item[field] !== "undefined") {
          const v = item[field]

          if (!facets["data"][field][v]) {
            facets["data"][field][v] = []
          }

          facets["data"][field][v].push(parseInt(item._id))
        }
      })

      return item
    })
    .value()

  facets["data"] = mapValues(facets["data"], function (values, field) {
    if (!facets["bits_data"][field]) {
      facets["bits_data"][field] = {}
      facets["bits_data_temp"][field] = {}
    }

    //console.log(values);
    return mapValues(values, function (indexes, filter) {
      const sortedIndices = sortBy(indexes)
      facets["bits_data"][field][filter] = new BitSet(sortedIndices)
      return sortedIndices
    })
  })

  return facets
}

/**
 * calculates ids for filters
 */
export const filterIds = function (facetData) {
  let output = new BitSet([])

  mapValues(facetData, function (values, key) {
    mapValues(facetData[key], function (facet_indexes, key2) {
      output = output.or(facetData[key][key2])
    })
  })

  return output
}

/**
 * calculates ids for facets
 * if there is no facet input then return null to not save resources for OR calculation
 * null means facets haven't matched searched items
 */
export const facets_ids = function (facets_data, filters) {
  let output = new BitSet([])
  let i = 0

  mapValues(filters, function (filters, field) {
    filters.forEach((filter) => {
      ++i
      output = output.or(facets_data[field][filter])
    })
  })

  if (i === 0) {
    return null
  }

  return output
}

export function mergeAggregations(aggregations, input) {
  return mapValues(clone(aggregations), (val, key) => {
    if (!val.field) {
      val.field = key
    }

    let filters = []
    if (input.filters && input.filters[key]) {
      filters = input.filters[key]
    }

    val.filters = filters

    let not_filters = []
    if (input.not_filters && input.not_filters[key]) {
      not_filters = input.not_filters[key]
    }

    if (input.exclude_filters && input.exclude_filters[key]) {
      not_filters = input.exclude_filters[key]
    }

    val.not_filters = not_filters

    return val
  })
}

export const inputToFacetFilters = function (input, config) {
  const filters = []

  mapValues(input.filters, function (values, key) {
    if (values && values.length) {
      if (config[key].conjunction !== false) {
        mapValues(values, (values2) => {
          filters.push([key, values2])
        })
      } else {
        const temp = []
        mapValues(values, (values2) => {
          temp.push([key, values2])
        })

        filters.push(temp)
      }
    }
  })

  mapValues(input.not_filters, function (values, key) {
    if (values && values.length) {
      mapValues(values, (values2) => {
        filters.push([key, "-", values2])
      })
    }
  })

  return filters
}
