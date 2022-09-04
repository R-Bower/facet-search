import {existsSync, writeFile} from "fs-extra"
import {resolve} from "path"

const outDir = "dist"

const typesFile = resolve(__dirname, `../${outDir}/types/index.d.ts`)

const fileTemplate = `export * from "../${outDir}/types"\n`

const files = [
  `${outDir}/facets.cjs.d.ts`,
  `${outDir}/facets.esm.d.ts`,
  `${outDir}/facets.umd.d.ts`,
  `${outDir}/facets.umd.min.d.ts`,
]

// Generates TypeScript files for every export format
export async function postBuild() {
  if (!existsSync(typesFile)) {
    console.error("index.d.ts not found, exiting")
    return false
  }

  return Promise.all(
    files.map((file) => {
      const path = resolve(__dirname, "../", file)
      return writeFile(path, fileTemplate)
    }),
  )
    .then(() => true)
    .catch(() => false)
}
