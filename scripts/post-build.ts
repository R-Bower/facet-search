import {existsSync, writeFile} from "fs-extra"
import {resolve} from "path"

const outDir = "dist"

const typesFile = resolve(__dirname, `../${outDir}/index.d.ts`)

const fileTemplate = `export * from "../${outDir}/index"\n`

const files = [
  `${outDir}/facets.cjs.d.ts`,
  `${outDir}/facets.esm.d.ts`,
  `${outDir}/facets.umd.d.ts`,
  `${outDir}/facets.umd.min.d.ts`,
]

// Generates TypeScript files for every export format
async function main() {
  if (!existsSync(typesFile)) {
    return console.error("index.d.ts not found, exiting")
  }

  return Promise.all(
    files.map((file) => {
      const path = resolve(__dirname, "../", file)
      return writeFile(path, fileTemplate)
    }),
  )
}

main()
