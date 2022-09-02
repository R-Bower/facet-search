# facet-search

An in-memory facet search, similar to SOLR's faceting.

Forked from [itemsjs](https://github.com/itemsapi/itemsjs), but enhanced with the following:

- Supports nested object properties.
- 100% TypeScript rewrite.
- ES2022 features and code style.
- Bug fixes

### Bugs Fixed

`itemsjs` relies on [FastBitSet](https://github.com/lemire/FastBitSet.js/) which sometimes throws errors depending on the input data.  This library replaces `FastBitSet` with [BitSet](https://www.npmjs.com/package/bitset) to fix this problem.
