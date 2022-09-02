import {expect} from "chai"

import {FacetSearch} from "../src"

const items: {genres: string | string[]}[] = [
  {
    genres: "Western",
  },
  {
    genres: "Western",
  },
  {
    genres: "Comedy",
  },
  {
    genres: "Drama",
  },
  {
    genres: "Horror",
  },
  {
    genres: "Romance",
  },
  {
    genres: "Western",
  },
]

describe("facet sorting", function () {
  it("sort by key", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          sort: "key",
        },
      },
    }).aggregation({
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Comedy",
      "Drama",
      "Horror",
      "Romance",
      "Western",
    ])
  })

  it("sort by key (field, not array)", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          order: "desc",
          sort: "key",
        },
      },
    }).aggregation({
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Western",
      "Romance",
      "Horror",
      "Drama",
      "Comedy",
    ])
  })

  it("sort by key descending", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          order: "desc",
          sort: "key",
        },
      },
    }).aggregation({
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Western",
      "Romance",
      "Horror",
      "Drama",
      "Comedy",
    ])
  })

  it("sort by doc_count", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          order: "desc",
          sort: "doc_count",
        },
      },
    }).aggregation({
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Western",
      "Comedy",
      "Drama",
      "Horror",
      "Romance",
    ])
  })

  it("sort by count", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          order: "desc",
          sort: "count",
        },
      },
    }).aggregation({
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Western",
      "Comedy",
      "Drama",
      "Horror",
      "Romance",
    ])
  })

  it("sort by doc_count and key and order key desc", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          order: ["desc", "desc"],
          sort: ["doc_count", "key"],
        },
      },
    }).aggregation({
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Western",
      "Romance",
      "Horror",
      "Drama",
      "Comedy",
    ])
  })

  it("sort by selected, key and order by desc, asc if sort is term", () => {
    const resultArray = new FacetSearch(items, {
      aggregations: {
        genres: {
          order: ["desc", "asc"],
          sort: ["selected", "key"],
        },
      },
    }).aggregation({
      name: "genres",
    })

    const resultTerm = new FacetSearch(items, {
      aggregations: {
        genres: {
          sort: "term",
        },
      },
    }).aggregation({
      name: "genres",
    })

    expect(resultArray.data.buckets).deep.eq(resultTerm.data.buckets)
  })

  it("sort by selected if chosen_filters_on_top is not set", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          sort: "term",
        },
      },
    }).aggregation({
      filters: {
        genres: ["Drama", "Romance"],
      },
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Drama",
      "Romance",
      "Comedy",
      "Horror",
      "Western",
    ])
  })

  it("does not sort by selected if chosen_filters_on_top is false", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          chosenFiltersOnTop: false,
          sort: "key",
        },
      },
    }).aggregation({
      filters: {
        genres: ["Drama", "Romance"],
      },
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq([
      "Comedy",
      "Drama",
      "Horror",
      "Romance",
      "Western",
    ])
  })

  it("excludes filters with zero doc_count if hide_zero_doc_count is true", () => {
    const aggregation = new FacetSearch(items, {
      aggregations: {
        genres: {
          hideZeroDocCount: true,
        },
      },
    }).aggregation({
      filters: {
        genres: ["Western"],
      },
      name: "genres",
    })

    expect(aggregation.data.buckets.map((v) => v.key)).deep.eq(["Western"])
  })
})
