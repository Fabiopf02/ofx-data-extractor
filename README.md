# [ofx-data-extractor](https://www.npmjs.com/package/ofx-data-extractor)

[![npm version](https://badge.fury.io/js/ofx-data-extractor.svg)](https://badge.fury.io/js/ofx-data-extractor)
[![MIT License][license-image]][license-url]
[![codecov](https://codecov.io/gh/Fabiopf02/ofx-data-extractor/branch/main/graph/badge.svg?token=L4A7E4H8IN)](https://codecov.io/gh/Fabiopf02/ofx-data-extractor)
[![Release Package](https://github.com/Fabiopf02/ofx-data-extractor/actions/workflows/release.yml/badge.svg)](https://github.com/Fabiopf02/ofx-data-extractor/actions/workflows/release.yml)

`ofx-data-extractor` is a TypeScript library for parsing, normalizing and validating OFX files in Node.js and browser environments.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Node.js](#nodejs)
- [Browser (`fromBlob` is async)](#browser-fromblob-is-async)
- [Main Public API (`Ofx`)](#main-public-api-ofx)
- [Configuration (Extract)](#configuration-extract)
- [Developer Documentation](#developer-documentation)
- [Examples](#examples)
- [License](#license)

## Installation

```bash
npm install ofx-data-extractor
```

```bash
yarn add ofx-data-extractor
```

## Quick Start

```ts
import { Ofx } from 'ofx-data-extractor'

const data = 'OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\n...'
const ofx = new Ofx(data)

const raw = ofx.toJson()
const summary = ofx.getTransactionsSummary()
const normalized = ofx.toNormalized()
const validation = ofx.validate()
```

## Node.js

```ts
import fs from 'fs'
import { Ofx } from 'ofx-data-extractor'

const file = fs.readFileSync('/path/to/file.ofx')
const ofx = Ofx.fromBuffer(file)
console.log(ofx.getTransactionsSummary())
```

## Browser (`fromBlob` is async)

import { Ofx } from 'ofx-data-extractor'

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const ofx = await Ofx.fromBlob(file)
  console.log(ofx.toJson())
}
```

## Main Public API (`Ofx`)

- `new Ofx(data: string, config?: ExtractorConfig)`
- `Ofx.fromBuffer(buffer: Buffer)`
- `Ofx.fromBlob(blob: Blob)`
- `config(options)`
- `getType()`
- `getHeaders()`
- `getBankTransferList()`
- `getCreditCardTransferList()`
- `getTransactionsSummary()`
- `getContent()`
- `toJson()`
- `toNormalized(options?)`
- `validate()`
- `getWarnings()`

## Configuration (Extract)

- `nativeTypes?: boolean`
- `fitId?: 'normal' | 'separated'`
- `formatDate?: string`
- `parserMode?: 'strict' | 'lenient'`

Parser mode:

- `strict` (default): parsing errors throw.
- `lenient`: parsing errors fallback and are collected via `getWarnings()`.

## Developer Documentation

- [API Reference](docs/api.md)
- [Normalization Guide](docs/normalization.md)
- [Validation Guide](docs/validation.md)
- [Recipes](docs/recipes.md)
- [Migration Guide](docs/migration.md)

## Examples

- [Node basic](examples/node-basic.ts)
- [Browser basic](examples/browser-basic.ts)
- [Normalize + validate](examples/normalize-and-validate.ts)

## License

MIT

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
