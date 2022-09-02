import {terser} from "rollup-plugin-terser"
import typescript from "@rollup/plugin-typescript"

export default {
  input: "src/index.ts",
  output: [
    {
      file: "build/facets.cjs.js",
      format: "cjs",
      sourcemap: true
    },
    {
      file: "build/facets.cjs.min.js",
      format: "cjs",
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: "build/facets.esm.js",
      format: "esm",
      sourcemap: true
    },
    {
      file: "build/facets.esm.min.js",
      format: "esm",
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: "build/facets.umd.js",
      format: "umd",
      name: "@rbower/facets",
      sourcemap: true
    },
    {
      file: "build/facets.umd.min.js",
      format: "umd",
      name: "@rbower/facets",
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    typescript()
  ]
}
