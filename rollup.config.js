const { minify } = require('rollup-plugin-esbuild')
const typescript = require('@rollup/plugin-typescript')
const name = require('./package.json').main.replace(/\.js$/, '')

module.exports = [
  {
    input: 'src/index.ts',
    treeshake: true,
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
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
        name: 'ofx',
        exports: 'named',
        sourcemap: true,
      },
      {
        file: `${name}.esm.js`,
        format: 'esm',
        name: 'ofx',
        exports: 'named',
        sourcemap: true,
      },
    ],
  },
]
