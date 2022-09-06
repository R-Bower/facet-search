import {expect} from "chai"

import {FacetSearch} from "../src"
import movies from "./fixtures/movies-nested.json"

type Movie = {
  actors: string[]
  country: string[]
  details: {
    description: string
    director: string[]
    name: string
    rating: number
    storyline: string
    votes: number
    year: number
  }
  genres: string[]
  reviews_count: number
  runtime: number
  tags: string[]
}

describe("nested facets", () => {
  const searcher = new FacetSearch<Movie>(movies, {
    filterFields: {
      description: {
        field: "details.description",
      },
      director: {
        field: "details.director",
      },
      name: {
        field: "details.name",
      },
    },
  })

  it("applies filters to nested fields", () => {
    const result = searcher.search({
      filters: {
        name: ["The Godfather"],
      },
    })

    expect(result.data.items).deep.eq([movies[1]])
  })

  it("applies filters to nested array fields", () => {
    const result = searcher.search({
      filters: {
        director: ["Francis Ford Coppola"],
      },
    })

    expect(result.data.items).deep.eq([movies[1], movies[3]])
  })
})
