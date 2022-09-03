import {expect} from "chai"

import {FacetSearch} from "../src"

describe("itemjs general tests", function () {
  const items = [
    {
      actors: ["a", "b"],
      name: "movie1",
      tags: ["a", "b", "c", "d"],
    },
    {
      actors: ["a", "b"],
      name: "movie2",
      tags: ["a", "e", "f"],
    },
    {
      actors: ["e"],
      name: "movie3",
      tags: ["a", "c"],
    },
  ]

  const similarItems = [
    {
      name: "movie1",
      tags: "Another tag",
    },
    {
      name: "movie2",
      tags: "Another",
    },
    {
      name: "movie3",
      tags: "Another tag",
    },
  ]

  const facetSearch = new FacetSearch(items, {})

  it("makes search", () => {
    const result = facetSearch.search()
    expect(result.data.items.length).eq(3)
  })

  it("makes search with pagination", () => {
    let result = facetSearch.search({
      perPage: 1,
    })
    expect(result.data.items.length).eq(1)

    result = facetSearch.search({
      page: 4,
      perPage: 1,
    })
    expect(result.data.items.length).eq(0)

    result = facetSearch.search({
      page: 3,
      perPage: 1,
    })
    expect(result.data.items.length).eq(1)
  })

  it("makes search with pagination, and is_all_filtered_items", () => {
    let result = facetSearch.search({
      isAllFilteredItems: true,
      perPage: 1,
    })
    expect(result.data.items.length).eq(1)
    expect(result.data?.allFilteredItems?.length).eq(3)

    result = facetSearch.search({
      isAllFilteredItems: false,
      perPage: 1,
    })
    expect(result.data.items.length).eq(1)
    expect(result.data.allFilteredItems).eq(undefined)

    result = facetSearch.search({
      perPage: 1,
    })
    expect(result.data.items.length).eq(1)
    expect(result.data.allFilteredItems).eq(undefined)
  })

  it("makes search with aggregation filters", () => {
    const searcher = new FacetSearch(items, {
      filterFields: {
        actors: {},
        tags: {},
      },
    })

    let result = searcher.search({
      filters: {
        tags: ["e", "f"],
      },
    })
    expect(result.data.items.length).eq(1)

    result = searcher.search({
      filters: {
        actors: ["a", "b"],
        tags: ["e", "f"],
      },
    })
    expect(result.data.items.length).eq(1)
  })

  it("makes search with aggregation filters with single value object", () => {
    const searcher = new FacetSearch(similarItems, {
      filterFields: {
        tags: {},
      },
    })

    const result = searcher.search()
    expect(result.data.items.length).eq(3)
    expect(result.data.facets.tags.buckets[0].docCount).eq(2)
    expect(result.data.facets.tags.buckets[1].docCount).eq(1)
  })

  it("makes facets when configuration supplied", () => {
    const searcher = new FacetSearch(items, {
      filterFields: {
        tags: {
          size: 10,
        },
      },
    })
    const result = searcher.search({})

    expect(result.data.items.length).eq(3)
    //assert.equal(result.data.aggregations.tags.name, 'tags');
    expect(result.data.facets.tags.buckets.length).eq(6)
  })

  it("makes facets for non array (string) fields", () => {
    const items = [
      {
        name: "movie1",
        tags: "a",
      },
      {
        name: "movie2",
        tags: "a",
      },
      {
        name: "movie3",
        tags: "a",
      },
    ]

    const searcher = new FacetSearch(items, {
      filterFields: {
        tags: {
          size: 10,
        },
      },
    })
    const result = searcher.search({})
    expect(result.data.items.length).eq(3)
    //assert.equal(result.data.aggregations.tags.name, 'tags');
    expect(result.data.facets.tags.buckets.length).eq(1)
    expect(result.data.facets.tags.buckets[0].docCount).eq(3)
  })

  it("makes facets for undefined field", () => {
    const items = [
      {
        name: "movie1",
      },
      {
        name: "movie2",
      },
      {
        name: "movie3",
      },
    ]

    const searcher = new FacetSearch(items, {
      filterFields: {
        tags: {
          size: 10,
        },
      },
    })
    const result = searcher.search({})
    expect(result.data.items.length).eq(3)
  })
})
