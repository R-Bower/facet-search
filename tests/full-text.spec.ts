import {expect} from "chai"

import {FacetSearch} from "../src"
import items from "./fixtures/items.json"

describe("Full Text Search", () => {
  const searcher = new FacetSearch(items, {
    aggregations: {
      actors: {conjunction: true},
    },
    searchableFields: ["actors", "name"],
  })

  it("returns no results for query that doesn't match", () => {
    const result = searcher.search({
      query: "blueberry",
    })
    expect(result.data.items.length).eq(0)
  })

  it("filters results based on query", () => {
    const result = searcher.search({query: "john"})

    expect(result.data.items).deep.eq([items[0], items[1]])
  })
})
