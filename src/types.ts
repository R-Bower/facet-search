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
  filters?: Record<string, string[]>
  name: A
  /** @default 1 */
  page?: number
  /** @default 10 */
  per_page?: number
  query?: string
}

export interface SearchOptions<
  I extends Record<string, unknown>,
  S extends string,
  A extends string,
> {
  /** A custom function to filter values */
  filter?: (item: I) => boolean
  filters?: Partial<Record<A, string[]>>
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

export interface Bucket<I extends Record<string, unknown>> {
  doc_count: number
  key: keyof I & string
  selected: boolean
}

export type Buckets<I extends Record<string, unknown>> = Array<Bucket<I>>

export interface Aggregation {
  conjunction?: boolean
  /** @default 'asc' */
  order?: Order[] | Order
  /** @default 10 */
  size?: number
  /** @default 'count' */
  sort?:
    | "term"
    | "count"
    | "selected"
    | "key"
    | "doc_count"
    | Array<"term" | "count" | "selected" | "key" | "doc_count">
}

/** Configuration for FacetSearch */
export interface Configuration<
  I extends Record<string, unknown>,
  S extends string,
  A extends string,
> {
  aggregations?: Record<A, Aggregation>
  /** @default true */
  native_search_enabled?: boolean
  /** @default [] */
  searchableFields?: Array<keyof I>
  sortings?: Record<S, Sorting<I>>
}
