import {expect} from "chai"

import {FacetSearch} from "../src"
import items from "./fixtures/items-nested.json"

type Item = {
  actors: string[]
  category: string
  in_cinema: boolean
  movieId: number
  name: string
  tags: string[]
  viewers: Array<{
    email: string
    firstName: string
    id: number
    lastName: string
  }>
  year: number
}

describe("nested facet arrays", () => {
  const searcher = new FacetSearch<Item>(items, {
    filterFields: {
      viewerEmail: {
        and: false,
        field: "viewers.*.email",
      },
      viewerFirstName: {
        field: "viewers.*.firstName",
      },
      viewerLastName: {
        field: "viewers.*.lastName",
      },
    },
  })

  it("missing filterField triggers exception", () => {
    try {
      searcher.search({
        filters: {
          someRandomField: ["Yes"],
        },
      })
    } catch (err: any) {
      expect(err.message).eq(
        "Missing field for filter.  Did you forget to include it in the filterFields config?",
      )
    }
  })

  it("applies filters to nested array objects - 1", () => {
    const result = searcher.search({
      filters: {
        viewerFirstName: ["Mindy"],
      },
    })
    expect(result.data.items).deep.eq([items[0], items[1]])
  })

  it("applies filters to nested array objects - 2", () => {
    const result = searcher.search({
      filters: {
        viewerFirstName: ["Mindy"],
        viewerLastName: ["Dadswell"],
      },
    })
    expect(result.data.items).deep.eq([items[1]])
  })

  it("applies filters to nested array objects - 3", () => {
    const result = searcher.search({
      filters: {
        viewerEmail: [
          "rbatkin4@plala.or.jp",
          "fvannoni3@goo.ne.jp",
          "olaborda5@taobao.com",
        ],
      },
    })
    expect(result.data.items).deep.eq([items[0], items[2], items[3]])
  })
})
