import {expect} from "chai"

import {FacetSearch} from "../src"
import movies from "./fixtures/movies.json"

const configuration = {
  filterFields: {
    actors: {},
    director: {},
    genres: {},
    year: {},
  },
}

describe("aggregation / facet", function () {
  const facetSearch = new FacetSearch(movies, configuration)

  it("makes error if name does not exist", () => {
    try {
      facetSearch.aggregation({
        name: "category2",
      })
    } catch (err: unknown) {
      expect((err as {message: string}).message).eq(
        'filterField "category2" is missing from config',
      )
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
      perPage: 1,
    })

    expect(result.data.buckets.length).eq(1)
  })

  it("makes single facet pagination", () => {
    const result = facetSearch.aggregation({
      name: "genres",
      page: 1,
      perPage: 12,
    })

    expect(result.data.buckets.length).eq(12)
  })
})
