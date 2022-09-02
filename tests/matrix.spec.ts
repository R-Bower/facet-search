import {expect} from "chai"

import {combinationIndices, indexFields, matrix} from "../src/helpers"

describe("filtering and generating facets with matrix (9 rows in dataset)", () => {
  const items = [
    {a: 1, b: 2, c: 3, d: 3},
    {a: 1, b: 3, c: 3, d: 3},
    {a: 2, b: 3, c: 3, d: 3},
    {a: 1, b: 2, c: 3, d: 3},
    {a: 2, b: 3, c: 3, d: 3},
    {a: 1, b: 2, c: 3, d: 3},
    {a: 1, b: 3, c: 3, d: 3},
    {a: 2, b: 3, c: 3, d: 3},
    {a: 2, b: 2, c: 3, d: 3},
  ]

  const fields = ["a", "b", "c"]

  it("checks matrix with no argument provided", () => {
    const {facets} = indexFields(items, fields)

    const result = matrix(facets)
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([1, 2, 4, 6, 7])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([3, 5, 8, 9])
    expect(result.bitsDataTemp.b["2"].toArray()).deep.eq([1, 4, 6, 9])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([2, 3, 5, 7, 8])
    expect(result.bitsDataTemp.c["3"].toArray()).deep.eq([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ])
  })

  it("checks matrix with some values", () => {
    const {facets} = indexFields(items, fields)

    const result = combinationIndices(facets, [[["a", 2]]])
    expect([3, 5, 8, 9]).deep.eq(result.a.toArray())
    expect(undefined).eq(result.b)

    const result2 = matrix(facets, [["a", 2]])
    expect(result2.bitsDataTemp.a["1"].toArray()).deep.eq([])
    expect(result2.bitsDataTemp.a["2"].toArray()).deep.eq([3, 5, 8, 9])
    expect(result2.bitsDataTemp.b["2"].toArray()).deep.eq([9])
    expect(result2.bitsDataTemp.b["3"].toArray()).deep.eq([3, 5, 8])
    expect(result2.bitsDataTemp.c["3"].toArray()).deep.eq([3, 5, 8, 9])
  })

  it("checks matrix with one not existing value", () => {
    const {facets} = indexFields(items, fields)

    const result = matrix(facets, [
      ["a", 2],
      ["c", 2],
    ])
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["2"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.c["3"].toArray()).deep.eq([])
  })

  it("checks matrix with disjunctive values", () => {
    const {facets} = indexFields(items, fields)

    const result = combinationIndices(facets, [
      [
        ["a", 1],
        ["a", 2],
      ],
    ])
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9]).deep.eq(result.a.toArray())
    expect(undefined).eq(result.b)

    const result2 = matrix(facets, [
      [
        ["a", 1],
        ["a", 2],
      ],
    ])
    expect(result2.bitsDataTemp.a["1"].toArray()).deep.eq([1, 2, 4, 6, 7])
    expect(result2.bitsDataTemp.a["2"].toArray()).deep.eq([3, 5, 8, 9])
    expect(result2.bitsDataTemp.b["2"].toArray()).deep.eq([1, 4, 6, 9])
    expect(result2.bitsDataTemp.b["3"].toArray()).deep.eq([2, 3, 5, 7, 8])
    expect(result2.bitsDataTemp.c["3"].toArray()).deep.eq([
      1, 2, 3, 4, 5, 6, 7, 8, 9,
    ])
  })

  it("checks matrix with disjunctive values (ittocean case)", () => {
    const {facets} = indexFields(items, fields)

    const result = combinationIndices(facets, [
      [["a", 1]],
      [["b", 2]],
      [["c", 3]],
    ])
    expect([1, 2, 4, 6, 7]).deep.eq(result.a.toArray())
    expect([1, 4, 6, 9]).deep.eq(result.b.toArray())
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9]).deep.eq(result.c.toArray())

    const result2 = matrix(facets, [[["a", 1]], [["b", 2]], [["c", 3]]])
    expect(result2.bitsDataTemp.a["1"].toArray()).deep.eq([1, 4, 6])
    expect(result2.bitsDataTemp.a["2"].toArray()).deep.eq([9])
    expect(result2.bitsDataTemp.b["2"].toArray()).deep.eq([1, 4, 6])
    expect(result2.bitsDataTemp.b["3"].toArray()).deep.eq([2, 7])
    expect(result2.bitsDataTemp.c["3"].toArray()).deep.eq([1, 4, 6])
  })
})

describe("filtering and generating facets for another dataset (3 rows in dataset)", () => {
  const items = [
    {a: 1, b: 1, c: 3},
    {a: 2, b: 2, c: 3},
    {a: 3, b: 3, c: 3},
  ]

  const fields = ["a", "b", "c"]

  it("checks matrix with disjunctive values", () => {
    const {facets} = indexFields(items, fields)

    const result = matrix(facets, [
      [
        ["a", 1],
        ["a", 2],
      ],
    ])
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([1])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([2])
    expect(result.bitsDataTemp.a["3"].toArray()).deep.eq([3])
    expect(result.bitsDataTemp.b["1"].toArray()).deep.eq([1])
    expect(result.bitsDataTemp.b["2"].toArray()).deep.eq([2])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.c["3"].toArray()).deep.eq([1, 2])
  })

  it("checks matrix with one disjunctive value", () => {
    const {facets} = indexFields(items, fields)

    const result = matrix(facets, [[["a", 1]]])
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([1])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([2])
    expect(result.bitsDataTemp.a["3"].toArray()).deep.eq([3])
    expect(result.bitsDataTemp.b["1"].toArray()).deep.eq([1])
    expect(result.bitsDataTemp.b["2"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.c["3"].toArray()).deep.eq([1])
  })

  it("checks matrix with many disjunctive values", () => {
    const {facets} = indexFields(items, fields)
    const result = matrix(facets, [[["a", 1]], [["b", 1]], [["c", 3]]])
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([1])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.a["3"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["1"].toArray()).deep.eq([1])
    expect(result.bitsDataTemp.b["2"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.c["3"].toArray()).deep.eq([1])
  })

  it("checks matrix with negative filter values", () => {
    const {facets} = indexFields(items, fields)
    const result = matrix(facets, [["a", "-", 1]])
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([2])
    expect(result.bitsDataTemp.a["3"].toArray()).deep.eq([3])
    expect(result.bitsDataTemp.b["1"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["2"].toArray()).deep.eq([2])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([3])
    expect(result.bitsDataTemp.c["3"].toArray()).deep.eq([2, 3])
  })

  it("checks matrix with negative filter values (2)", () => {
    const {facets} = indexFields(items, fields)
    const result = matrix(facets, [
      ["a", "-", 1],
      ["b", "-", 2],
    ])
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.a["3"].toArray()).deep.eq([3])
    expect(result.bitsDataTemp.b["1"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["2"].toArray()).deep.eq([])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([3])
    expect(result.bitsDataTemp.c["3"].toArray()).deep.eq([3])
  })
})

describe("filtering and generating facets (4 rows in dataset)", function () {
  const items = [
    {a: 1, b: 3},
    {a: 1, b: 4},
    {a: 2, b: 3},
    {a: 2, b: 4},
  ]

  const fields = ["a", "b"]

  it("checks matrix with disjunctive values", () => {
    const {facets} = indexFields(items, fields)

    const result = matrix(facets)
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([1, 2])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([3, 4])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([1, 3])
    expect(result.bitsDataTemp.b["4"].toArray()).deep.eq([2, 4])
  })

  it("checks matrix with disjunctive values", () => {
    const {facets} = indexFields(items, fields)

    const result = matrix(facets, [[["a", 1]]])
    expect(result.bitsDataTemp.a["1"].toArray()).deep.eq([1, 2])
    expect(result.bitsDataTemp.a["2"].toArray()).deep.eq([3, 4])
    expect(result.bitsDataTemp.b["3"].toArray()).deep.eq([1])
    expect(result.bitsDataTemp.b["4"].toArray()).deep.eq([2])
  })

  it("checks matrix with disjunctive values", () => {
    const {facets} = indexFields(items, fields)

    const result = combinationIndices(facets, [[["b", 3]], [["a", 1]]])
    expect([1, 2]).deep.eq(result.a.toArray())
    expect([1, 3]).deep.eq(result.b.toArray())

    const result2 = matrix(facets, [[["b", 3]], [["a", 1]]])
    expect([1]).deep.eq(result2.bitsDataTemp.a["1"].toArray())
    expect([3]).deep.eq(result2.bitsDataTemp.a["2"].toArray())
    expect([1]).deep.eq(result2.bitsDataTemp.b["3"].toArray())
    expect([2]).deep.eq(result2.bitsDataTemp.b["4"].toArray())
  })
})
