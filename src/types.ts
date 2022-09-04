import BitSet from "bitset"

export interface Item extends Record<string, unknown> {
  _id?: number
  id?: string
}

export interface IndexedItem extends Record<string, unknown> {
  _id: number
}

export type FilterValue = Array<string | number>

export interface Pagination {
  page: number
  perPage: number
  total: number
}

export type Order = "asc" | "desc"

export interface SortConfig {
  field: string | string[]
  order?: Order | Order[]
}

export interface AggregationOptions {
  // AND query (results have to fit all selected facet-values), defaults to true
  and?: boolean
  filters?: Record<string, FilterValue>
  name: string
  /** @default 1 */
  page?: number
  /** @default 10 */
  perPage?: number
  query?: string
}

export type FullTextSearchInput = {
  query: string
  searchableFields: string[]
}

export interface SearchInput {
  filterConfig?: Record<string, FilterConfig>
  filters?: Record<string, FilterValue>
  ids?: number[]
  /** @default false */
  isAllFilteredItems?: boolean
  /** @default 1 */
  page?: number
  /** @default 12 */
  perPage?: number
  query?: string
  sort?: SortConfig
}

export interface Bucket<I extends Item> {
  docCount: number
  key: keyof I & string
  selected: boolean
}

export type Buckets<I extends Item> = Array<Bucket<I>>

export type Sort = "term" | "count" | "selected" | "key" | "docCount"

export type FilterConfig = {
  // AND query (results have to fit all selected facet-values), defaults to true
  and?: boolean
  chosenFiltersOnTop?: boolean
  // Optional field for targeting deeply-nested values.
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
export interface Configuration {
  filterFields?: Record<string, FilterConfig>
  searchableFields?: string[]
  sortings?: Record<string, SortConfig>
}

export type BitDataMap = Record<string, Record<string, number[]>>

export type BitSetDataMap = Record<string, Record<string, BitSet>>

export interface FacetData {
  bitsData: BitSetDataMap
  bitsDataTemp: BitSetDataMap
  data: BitDataMap
  ids?: BitSet
}

export interface IndexFieldsResult<I extends Item> {
  facets: FacetData
  ids: number[]
  indexedItems: Array<I & {_id: number}>
  itemsMap: Record<number, I & {_id: number}>
}

export interface AggregationResult<I extends Item> {
  data: {
    buckets: Buckets<I & {_id: number}>
  }
  pagination: Pagination
}
