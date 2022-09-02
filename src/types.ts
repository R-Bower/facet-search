import BitSet from "bitset"

export interface Item extends Record<string, unknown> {
  _id?: number
  id?: string
}

export type FilterValue = Array<string | number>

export interface Pagination {
  page: number
  per_page: number
  total: number
}

export type Order = "asc" | "desc"

export interface Sorting<I extends Record<string, unknown>> {
  field: keyof I | Array<keyof I>
  order?: Order | Order[]
}

export interface AggregationOptions<A extends string> {
  conjunction?: boolean
  filters?: Record<string, FilterValue>
  name: A
  /** @default 1 */
  page?: number
  /** @default 10 */
  per_page?: number
  query?: string
}

export interface SearchOptions<
  I extends Item,
  S extends string,
  A extends string,
> {
  /** A custom function to filter values */
  _ids?: number[]
  aggregations?: Record<A, Aggregation>
  filter?: (item: I) => boolean
  filters?: Record<string, FilterValue>
  ids?: number[]
  /** @default false */
  isExactSearch?: boolean
  /** @default false */
  is_all_filtered_items?: boolean
  /** @default 1 */
  page?: number
  /** @default 12 */
  per_page?: number
  /** @default false */
  removeStopWordFilter?: boolean
  /** The name of a sort defined in the configuration's sortings, or a new custom one */
  sort?: S | Sorting<I>
}

export interface Bucket<I extends Item> {
  doc_count: number
  key: keyof I & string
  selected: boolean
}

export type Buckets<I extends Item> = Array<Bucket<I>>

export type Sort = "term" | "count" | "selected" | "key" | "doc_count"

export type Aggregation = {
  chosenFiltersOnTop?: boolean
  conjunction?: boolean
  field?: string
  filters?: FilterValue
  hideZeroDocCount?: boolean
  /** @default 'asc' */
  order?: Order[] | Order
  /** @default 10 */
  size?: number
  /** @default 'count' */
  sort?: Sort | Sort[]
}

/** Configuration for FacetSearch */
export interface Configuration<
  I extends Item,
  S extends string,
  A extends string,
> {
  aggregations?: Record<A, Aggregation>
  /** @default [] */
  sortings?: Record<S, Sorting<I>>
}

export type BitDataMap = Record<string, Record<string, number[]>>

export type BitSetDataMap = Record<string, Record<string, BitSet>>

export type FacetData = {
  bits_data: BitSetDataMap
  bits_data_temp: BitSetDataMap
  data: BitDataMap
  ids?: BitSet
}
