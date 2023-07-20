const { minify } = require('rollup-plugin-esbuild')
const typescript = require('@rollup/plugin-typescript')
const commonjs = require('@rollup/plugin-commonjs')
const nodeResolve = require('@rollup/plugin-node-resolve')
const name = require('./package.json').main.replace(/\.js$/, '')

/**
 * @type {import('rollup').RollupOptions}
 */
module.exports = [
  {
    input: 'src/index.ts',
    treeshake: true,
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      commonjs(),
      nodeResolve(),
      minify({
        keepNames: false,
        treeShaking: true,
        minify: true,
      }),
    ],
    output: [
      {
        file: `${name}.js`,
        format: 'cjs',
        sourcemap: false,
      },
      {
        file: `${name}.js`,
        format: 'iife',
        name: 'ofx',
        sourcemap: false,
      },
    ],
  },
]
