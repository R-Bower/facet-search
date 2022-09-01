import {expect} from "chai"

import {FacetSearch} from "../src"
import movies from "./fixtures/movies.json"

const configuration = {
  aggregations: {
    actors: {
      conjunction: true,
    },
    director: {
      conjunction: true,
    },
    genres: {
      conjunction: true,
    },
    year: {
      conjunction: true,
    },
  },
}

describe("aggregation / facet", function () {
  const facetSearch = new FacetSearch(movies, configuration)

  it("makes error if name does not exist", () => {
    try {
      facetSearch.aggregation({
        name: "category2",
      })
    } catch (err) {
      expect(err.message).eq('Please define aggregation "category2" in config')
    }
  })

  it("makes single facet", () => {
    const result = facetSearch.aggregation({
      name: "genres",
    })

    expect(result.data.buckets.length).eq(10)
  })

  it("makes single facet with pagination", () => {
    const result = facetSearch.aggregation({
      name: "genres",
      page: 1,
      per_page: 1,
    })

    expect(result.data.buckets.length).eq(1)
  })

  it("makes single facet pagination", () => {
    const result = facetSearch.aggregation({
      name: "genres",
      page: 1,
      per_page: 12,
    })

    expect(result.data.buckets.length).eq(12)
  })
})
