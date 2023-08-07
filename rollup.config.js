const { minify } = require('rollup-plugin-esbuild')
const typescript = require('@rollup/plugin-typescript')
const commonjs = require('@rollup/plugin-commonjs')
const nodeResolve = require('@rollup/plugin-node-resolve')
const lib = require('./package.json')

/**
 * @type {import('rollup').RollupOptions}
 */
module.exports = () => {
  const year = new Date().getFullYear()
  const banner = `// Ofx-data-extractor v${lib.version} Copyright (c) ${year} ${lib.author}`

  return [
    {
      input: 'src/index.ts',
      treeshake: true,
      plugins: [
        typescript({ declaration: false }),
        commonjs(),
        nodeResolve(),
        minify({
          keepNames: false,
          treeShaking: true,
          minify: true,
          banner,
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
