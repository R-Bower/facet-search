import {expect} from "chai"

import {FacetSearch} from "../src"
import {Configuration} from "../src/types"
import items from "./fixtures/items.json"

describe("search", () => {
  const configuration: Configuration<typeof items[0], string, string> = {
    aggregations: {
      actors: {
        conjunction: true,
      },
      category: {
        conjunction: true,
      },
      in_cinema: {
        conjunction: true,
      },
      tags: {
        conjunction: true,
      },
      year: {
        conjunction: true,
      },
    },
  }

  const itemsjs = new FacetSearch(items, configuration)

  it("searches no params", () => {
    const result = itemsjs.search({})

    expect(result.data.items.length).eq(4)
    expect(result.data.items[0].category).eq("drama")
    expect(result.data.items[0].year).eq(1995)
    expect(result.data.items[0].in_cinema).eq(false)

    expect(result.data.items[0].in_cinema).eq(false)
    expect(result.data.aggregations.in_cinema.buckets[0].doc_count).eq(3)
    expect(result.data.aggregations.in_cinema.buckets[1].doc_count).eq(1)
    expect(result.data.aggregations.in_cinema.buckets.length).eq(2)
  })

  it("searches with two filters", () => {
    const result = itemsjs.search({
      filters: {
        category: ["drama"],
        tags: ["a"],
      },
    })

    expect(result.data.items.length).eq(2)
    expect(result.data.aggregations.tags.buckets[0].doc_count).eq(2)
  })

  it("makes search with empty filters", () => {
    const result = itemsjs.search({
      filters: {},
    })

    expect(result.data.items.length).eq(4)
  })
})

describe("no configuration", () => {
  const configuration = {
    aggregations: {},
  }

  it("searches with two filters", () => {
    const result = new FacetSearch(items, configuration).search({})

    expect(result.data.items.length).eq(4)
  })

  it("searches with filter", () => {
    const itemsjs = new FacetSearch(items, configuration)

    const result = itemsjs.search({})

    expect(result.data.items.length).eq(4)
  })
})
