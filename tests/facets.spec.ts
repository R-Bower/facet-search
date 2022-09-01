"use strict"

import BitSet from "bitset"
import {expect} from "chai"

import {FacetSearch} from "../src"
import {Facets} from "../src/facets"
import {getBuckets} from "../src/get-buckets"
import {facets_ids} from "../src/helpers"

const items = [
  {
    actors: ["john", "alex"],
    category: "drama",
    id: 1,
    name: "movie1",
    tags: ["a", "b", "c", "d"],
  },
  {
    actors: ["john", "brad"],
    category: "comedy",
    id: 2,
    name: "movie2",
    tags: ["a", "e", "f"],
  },
  {
    actors: ["jeff"],
    category: "comedy",
    id: 3,
    name: "movie3",
    tags: ["a", "c"],
  },
  {
    actors: ["jean"],
    category: "drama",
    id: 4,
    name: "movie4",
    tags: ["c", "a", "z"],
  },
]

describe("conjunctive search", function () {
  const aggregations = {
    actors: {
      conjunction: true,
    },
    category: {
      conjunction: true,
    },
    tags: {
      conjunction: true,
    },
  }

  const facets = new Facets(items, {
    aggregations: aggregations,
  })
  const facetSearch = new FacetSearch(items, {
    aggregations: aggregations,
  })

  it("checks index", () => {
    const result = facets.index()
    expect(result.data.tags.a).deep.eq([1, 2, 3, 4])
    expect(result.bits_data.tags.a.toArray()).deep.eq([1, 2, 3, 4])
    expect(result.data.tags.b).deep.eq([1])
    expect(result.bits_data.tags.b.toArray()).deep.eq([1])
    expect(result.data.tags.c).deep.eq([1, 3, 4])
    expect(result.data.tags.d).deep.eq([1])
    expect(result.data.tags.e).deep.eq([2])
    expect(result.data.tags.z).deep.eq([4])
    expect(result.data.actors.jean).deep.eq([4])
    expect(result.bits_data.actors.jean.toArray()).deep.eq([4])
    expect(result.data.actors.john).deep.eq([1, 2])
    expect(result.bits_data.actors.john.toArray()).deep.eq([1, 2])
  })

  it("returns facets for two fields (tags, actors)", () => {
    const input = {
      filters: {
        tags: ["c"],
      },
    }

    let result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 3, 4])
    expect(result.data.tags.c).deep.eq([1, 3, 4])
    expect(result.data.tags.e).deep.eq([])
    expect(result.data.actors.john).deep.eq([1])
    expect(result.data.category.comedy).deep.eq([3])

    const ids = facets_ids(result["bits_data_temp"], input.filters)

    expect(ids?.toArray()).deep.eq([1, 3, 4])

    const buckets = getBuckets(result, input, aggregations)
    expect(buckets.tags.buckets[0].doc_count).eq(3)
    expect(buckets.tags.buckets[0].key).eq("c")

    result = facetSearch.search(input)

    expect(result.pagination.total).eq(3)
    expect(result.data.aggregations.tags.buckets[0].doc_count).eq(3)
    expect(result.data.aggregations.tags.buckets[0].key).eq("c")
  })

  it("checks if search is working on copy data", () => {
    const input = {
      filters: {
        tags: ["e"],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([2])
    expect(result.data.tags.e).deep.eq([2])
  })

  it("returns facets for empty input", () => {
    let input = {
      filters: {},
    }

    let result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 2, 3, 4])
    expect(result.data.tags.e).deep.eq([2])

    const ids = facets_ids(result["bits_data_temp"], input.filters)
    expect(ids).eq(null)

    result = facetSearch.search(input)
    expect(result.pagination.total).eq(4)
    expect(result.data.aggregations.tags.buckets[0].doc_count).eq(4)
    expect(result.data.aggregations.tags.buckets[0].key).eq("a")

    input = {
      filters: {
        tags: [],
      },
    }

    result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 2, 3, 4])
    expect(result.data.tags.e).deep.eq([2])
  })

  it("returns facets for not existed filters (does not exist in index)", () => {
    const input = {
      filters: {
        tags: ["kkk"],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    console.debug(result.data.tags.a)

    expect(result.data.tags.a).deep.eq([])
    expect(result.data.tags.e).deep.eq([])
  })

  it("returns facets for cross filters", () => {
    const input = {
      filters: {
        actors: ["john"],
        tags: ["a"],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 2])
    expect(result.data.tags.e).deep.eq([2])
    expect(result.data.actors.john).deep.eq([1, 2])
    expect(result.data.actors.jean).deep.eq([])
  })
})

describe("disjunctive search", () => {
  const aggregations = {
    actors: {
      conjunction: false,
    },
    category: {
      conjunction: false,
    },
    tags: {
      conjunction: false,
    },
  }

  const facets = new Facets(items, {
    aggregations: aggregations,
  })

  it("returns facets", () => {
    const input = {
      filters: {
        tags: ["c"],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 2, 3, 4])
    expect(result.data.tags.c).deep.eq([1, 3, 4])
    expect(result.data.tags.e).deep.eq([2])
    expect(result.data.actors.john).deep.eq([1])
  })

  it("returns facets for two filters", () => {
    const input = {
      filters: {
        tags: ["z", "f"],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 2, 3, 4])
    expect(result.data.tags.c).deep.eq([1, 3, 4])
    expect(result.data.tags.f).deep.eq([2])
    expect(result.data.tags.z).deep.eq([4])

    expect(result.data.actors.brad).deep.eq([2])
    expect(result.data.actors.jean).deep.eq([4])
    expect(result.data.actors.brad).deep.eq([2])

    expect(result.data.category.comedy).deep.eq([2])
    expect(result.data.category.drama).deep.eq([4])
  })
})

describe("disjunctive and conjunctive search", function () {
  const aggregations = {
    actors: {
      conjunction: true,
    },
    category: {
      conjunction: false,
    },
    tags: {
      conjunction: true,
    },
  }

  const facets = new Facets(items, {
    aggregations: aggregations,
  })

  it("returns facets", () => {
    const input = {
      filters: {
        tags: ["c"],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 3, 4])
    expect(result.data.tags.e).deep.eq([])
    expect(result.data.actors.john).deep.eq([1])
    expect(result.data.category.comedy).deep.eq([3])
  })

  it("returns facets for cross filters", () => {
    const input = {
      filters: {
        category: ["drama"],
        tags: ["c"],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 4])
    expect(result.data.tags.c).deep.eq([1, 4])
    expect(result.data.tags.e).deep.eq([])
    expect(result.data.actors.john).deep.eq([1])
    expect(result.data.actors.alex).deep.eq([1])
    expect(result.data.category.comedy).deep.eq([3])
    expect(result.data.category.drama).deep.eq([1, 4])

    const ids = facets_ids(result["bits_data_temp"], input.filters)
    expect(ids?.toArray()).deep.eq([1, 4])
  })
})

describe("generates facets crossed with query", function () {
  const aggregations = {
    actors: {
      conjunction: true,
    },
    category: {
      conjunction: false,
    },
    tags: {
      conjunction: true,
    },
  }

  const facets = new Facets(items, {
    aggregations: aggregations,
  })

  it("returns facets for searched ids", () => {
    let input = {
      filters: {
        tags: ["c"],
      },
    }

    let result = facets.search(input, {
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1, 3, 4])
    expect(result.data.tags.e).deep.eq([])
    expect(result.data.actors.john).deep.eq([1])
    expect(result.data.category.comedy).deep.eq([3])

    input = {
      filters: {
        tags: ["c"],
      },
    }

    result = facets.search(input, {
      query_ids: new BitSet([1]),
      test: true,
    })

    expect(result.data.tags.a).deep.eq([1])
    expect(result.data.tags.e).deep.eq([])
    expect(result.data.actors.john).deep.eq([1])
    expect(result.data.category.comedy).deep.eq([])
  })
})

describe("generates symetrical disjunctive facets (SergeyRe)", function () {
  const aggregations = {
    a: {
      conjunction: false,
    },
    b: {
      conjunction: false,
    },
  }

  const items = [
    {a: 1, b: 3},
    {a: 1, b: 4},
    {a: 2, b: 3},
    {a: 2, b: 4},
  ]

  const facets = new Facets(items, {
    aggregations: aggregations,
  })

  it("provides symetrical result", () => {
    const input = {
      filters: {
        a: [1],
        b: [3],
      },
    }

    const result = facets.search(input, {
      test: true,
    })

    expect(result.data.a["1"]).deep.eq([1])
    expect(result.data.a["2"]).deep.eq([3])
    expect(result.data.b["3"]).deep.eq([1])
    expect(result.data.b["4"]).deep.eq([2])
  })
})
