import {FacetSearch} from "../src"
import moviesNested from "./fixtures/movies-nested.json"

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

describe("Nested facets", () => {
  const searcher = new FacetSearch<Movie, string>(moviesNested, {
    aggregations: {
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
})
