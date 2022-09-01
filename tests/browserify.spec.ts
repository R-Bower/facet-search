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
      per_page: 1,
    })
    expect(result.data.items.length).eq(1)

    result = facetSearch.search({
      page: 4,
      per_page: 1,
    })
    expect(result.data.items.length).eq(0)

    result = facetSearch.search({
      page: 3,
      per_page: 1,
    })
    expect(result.data.items.length).eq(1)
  })

  it("makes search with pagination, and is_all_filtered_items", () => {
    let result = facetSearch.search({
      is_all_filtered_items: true,
      per_page: 1,
    })
    expect(result.data.items.length).eq(1)
    expect(result.data.allFilteredItems.length).eq(3)

    result = facetSearch.search({
      is_all_filtered_items: false,
      per_page: 1,
    })
    expect(result.data.items.length).eq(1)
    expect(result.data.allFilteredItems).eq(null)

    result = facetSearch.search({
      per_page: 1,
    })
    expect(result.data.items.length).eq(1)
    expect(result.data.allFilteredItems).eq(null)
  })

  it("makes search with pagination and filter", () => {
    const result = facetSearch.search({
      filter: (item) => item.tags.includes("a"),
      page: 3,
      per_page: 1,
    })

    expect(result.data.items.length).eq(1)
  })

  it("makes search with aggregation filters", () => {
    const searcher = new FacetSearch(items, {
      aggregations: {
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
      aggregations: {
        tags: {},
      },
    })

    const result = searcher.search()
    expect(result.data.items.length).eq(3)
    expect(result.data.aggregations.tags.buckets[0].doc_count).eq(2)
    expect(result.data.aggregations.tags.buckets[1].doc_count).eq(1)
  })

  it("makes aggregations when configuration supplied", () => {
    const searcher = new FacetSearch(items, {
      aggregations: {
        tags: {
          size: 10,
          title: "Tags",
          type: "terms",
        },
      },
    })
    const result = searcher.search({})

    expect(result.data.items.length).eq(3)
    //assert.equal(result.data.aggregations.tags.name, 'tags');
    expect(result.data.aggregations.tags.buckets.length).eq(6)
  })

  it("makes aggregations for non array (string) fields", () => {
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
      aggregations: {
        tags: {
          size: 10,
          title: "Tags",
          type: "terms",
        },
      },
    })
    const result = searcher.search({})
    expect(result.data.items.length).eq(3)
    //assert.equal(result.data.aggregations.tags.name, 'tags');
    expect(result.data.aggregations.tags.buckets.length).eq(1)
    expect(result.data.aggregations.tags.buckets[0].doc_count).eq(3)
  })

  it("makes aggregations for undefined field", function test(done) {
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
      aggregations: {
        tags: {
          size: 10,
          title: "Tags",
          type: "terms",
        },
      },
    })
    const result = searcher.search({})
    expect(result.data.items.length).eq(3)
    done()
  })
})
