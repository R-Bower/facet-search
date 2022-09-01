import {intersection, orderBy} from "lodash-es"

/**
 * returns list of elements in aggregation
 * useful for autocomplete or list all aggregation options
 */
export function similar(items, id, options) {
  const perPage = options.per_page || 10
  const minimum = options.minimum || 0
  const page = options.page || 1

  let item

  for (let i = 0; i < items.length; ++i) {
    if (items[i].id == id) {
      item = items[i]
      break
    }
  }

  if (!options.field) {
    throw new Error("Please define field in options")
  }

  const field = options.field
  let sortedItems = []

  for (let i = 0; i < items.length; ++i) {
    if (items[i].id !== id) {
      const and = intersection(item[field], items[i][field])

      if (and.length >= minimum) {
        sortedItems.push(items[i])
        sortedItems[sortedItems.length - 1].intersection_length = and.length
      }
    }
  }

  sortedItems = orderBy(sortedItems, ["intersection_length"], ["desc"])

  return {
    data: {
      items: sortedItems.slice((page - 1) * perPage, page * perPage),
    },
    pagination: {
      page: page,
      per_page: perPage,
      total: sortedItems.length,
    },
  }
}
