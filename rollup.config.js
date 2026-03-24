const { minify } = require('rollup-plugin-esbuild')
const typescript = require('@rollup/plugin-typescript')
const commonjs = require('@rollup/plugin-commonjs')
const nodeResolve = require('@rollup/plugin-node-resolve')

/**
 * @type {import('rollup').RollupOptions}
 */
module.exports = () => {
  return [
    {
      input: 'src/index.ts',
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      plugins: [
        typescript({ declaration: false }),
        nodeResolve(),
        commonjs(),
        minify({
          keepNames: false,
          treeShaking: true,
          minify: true,
          globalName: 'ofx',
        }),
      ],
      output: [
        {
          file: 'dist/umd/bundle.min.js',
          format: 'umd',
          name: 'ofx',
        },
        {
          file: 'dist/esm/index.min.js',
          format: 'esm',
        },
      ],
    },
    {
      input: 'src/index.ts',
      plugins: [typescript({ tsconfig: './tsconfig.json' })],
      output: {
        file: 'dist/index.d.ts',
        format: 'esm',
      },
    },
  ]
}
