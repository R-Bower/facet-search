import {terser} from "rollup-plugin-terser"
import typescript from "@rollup/plugin-typescript"
import visualizer from "rollup-plugin-visualizer"

const outDir = "dist"

export default {
  input: "src/index.ts",
  output: [
    {
      file: `${outDir}/facets.cjs.js`,
      format: "cjs",
      sourcemap: true
    },
    {
      file: `${outDir}/facets.cjs.min.js`,
      format: "cjs",
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: `${outDir}/facets.esm.js`,
      format: "esm",
      sourcemap: true
    },
    {
      file: `${outDir}/facets.esm.min.js`,
      format: "esm",
      plugins: [
        terser(),
        visualizer({
          gzipSize: true,
          sourcemap: true,
          template: "list",
        }),
      ],
      sourcemap: true
    },
    {
      file: `${outDir}/facets.umd.js`,
      format: "umd",
      name: "@rbower/facets",
      sourcemap: true
    },
    {
      file: `${outDir}/facets.umd.min.js`,
      format: "umd",
      name: "@rbower/facets",
      plugins: [terser()],
      sourcemap: true
    }
  ],
  plugins: [
    typescript(),
  ]
}
