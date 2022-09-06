import BitSet from "bitset"
import {chain, mapValues, sortBy} from "lodash"

import {
  BitDataMap,
  BitSetDataMap,
  FacetData,
  IndexFieldsResult,
  Item,
} from "./types"

type IndexableByString = Record<string, unknown>

/**
 * Given path: "foo.bar.baz"
 * And item: {foo: {bar: {baz: 'buzz'}}}
 *   -> 'buzz'
 * @param path a dot-separated set of keys
 * @param item the item to get the value from
 *
 * Sourced from match-sorter.
 */
function getNestedValues<ItemType>(
  path: string,
  item: ItemType,
): Array<string> {
  const keys = path.split(".")

  type ValueA = Array<ItemType | IndexableByString | string>
  let values: ValueA = [item]

  for (let i = 0, I = keys.length; i < I; i++) {
    const nestedKey = keys[i]
    let nestedValues: ValueA = []

    for (let j = 0, J = values.length; j < J; j++) {
      const nestedItem = values[j]

      if (nestedItem === null) {
        continue
      }

      if (Object.hasOwnProperty.call(nestedItem, nestedKey)) {
        const nestedValue = (nestedItem as IndexableByString)[nestedKey]
        if (nestedValue !== null) {
          nestedValues.push(nestedValue as IndexableByString | string)
        }
      } else if (nestedKey === "*") {
        // ensure that values is an array
        nestedValues = nestedValues.concat(nestedItem)
      }
    }

    values = nestedValues
  }

  if (Array.isArray(values[0])) {
    // keep allowing the implicit wildcard for an array of strings at the end of
    // the path; don't use `.flat()` because that's not available in node.js v10
    const result: Array<string> = []
    return result.concat(...(values as Array<string>))
  }
  // Based on our logic it should be an array of strings by now...
  // assuming the user's path terminated in strings
  return values as Array<string>
}

export function buildFacets<I extends Item>(
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

        const fieldValue: any = getNestedValues(field, item)

        if (Array.isArray(fieldValue)) {
          fieldValue.forEach((v) => {
            if (Array.isArray(v)) {
              return console.error(
                "Field targets should be simple values, not arrays",
              )
            }

            if (typeof v === "object") {
              return console.error(
                "Field targets should be simple values, not objects",
              )
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
