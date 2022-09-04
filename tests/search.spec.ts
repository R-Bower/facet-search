import {expect} from "chai"

import {Configuration, FacetSearch} from "../src"
import items from "./fixtures/items.json"

describe("search", () => {
  const configuration: Configuration = {
    filterFields: {
      actors: {},
      category: {},
      in_cinema: {},
      tags: {},
      year: {},
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
    expect(result.data.facets.in_cinema.buckets[0].docCount).eq(3)
    expect(result.data.facets.in_cinema.buckets[1].docCount).eq(1)
    expect(result.data.facets.in_cinema.buckets.length).eq(2)
  })

  it("searches with two filters", () => {
    const result = itemsjs.search({
      filters: {
        category: ["drama"],
        tags: ["a"],
      },
    })

    expect(result.data.items.length).eq(2)
    expect(result.data.facets.tags.buckets[0].docCount).eq(2)
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
    filterFields: {},
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
