import {expect} from "chai"

import {FacetSearch} from "../src"
import items from "./fixtures/items.json"

describe("fulltext search", () => {
  const searcher = new FacetSearch(items, {
    filterFields: {
      actors: {},
      tags: {},
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

  it("filters results based on query and empty filters", () => {
    const result = searcher.search({
      filters: {
        tags: [],
      },
      query: "jeff",
    })

    expect(result.data.items).deep.eq([items[2]])
  })

  it("filters results based on query and filters - 1", () => {
    const result = searcher.search({
      filters: {
        tags: ["e"],
      },
      query: "jeff",
    })

    expect(result.data.items).deep.eq([])
  })

  it("filters results based on query and filters - 2", () => {
    const result = searcher.search({
      filters: {
        tags: ["a"],
      },
      query: "jeff",
    })

    expect(result.data.items).deep.eq([items[2]])
  })

  it("filters results based on query and filters - 3", () => {
    const result = searcher.search({
      filters: {
        tags: ["a"],
      },
      query: "brad",
    })

    expect(result.data.items).deep.eq([items[1]])
  })
})
