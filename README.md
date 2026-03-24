# [ofx-data-extractor](https://www.npmjs.com/package/ofx-data-extractor)

[![npm version](https://badge.fury.io/js/ofx-data-extractor.svg)](https://badge.fury.io/js/ofx-data-extractor)
[![MIT License][license-image]][license-url]
[![codecov](https://codecov.io/gh/Fabiopf02/ofx-data-extractor/branch/main/graph/badge.svg?token=L4A7E4H8IN)](https://codecov.io/gh/Fabiopf02/ofx-data-extractor)
[![Release Package](https://github.com/Fabiopf02/ofx-data-extractor/actions/workflows/release.yml/badge.svg)](https://github.com/Fabiopf02/ofx-data-extractor/actions/workflows/release.yml)

`ofx-data-extractor` is a TypeScript library for parsing, normalizing and validating OFX files in Node.js and browser environments.

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

## API

### `Ofx`

- `new Ofx(data: string, config?: ExtractorConfig)`
- `static fromBuffer(data: Buffer): Ofx`
- `static fromBlob(data: Blob): Promise<Ofx>`
- `config(options: ExtractorConfig): this`
- `getType(): Types`
- `getHeaders(): MetaData`
- `getBankTransferList(): StatementTransaction[]`
- `getCreditCardTransferList(): StatementTransaction[]`
- `getTransactionsSummary(): TransactionsSummary`
- `getContent(): OfxStructure`
- `toJson(): OfxResponse`
- `toNormalized(options?: NormalizeOptions): NormalizedOfxData`
- `validate(): ValidationReport`
- `getWarnings(): OfxDiagnostic[]`

## Configuration

`ExtractorConfig` options:

- `nativeTypes?: boolean`
- `fitId?: 'normal' | 'separated'`
- `formatDate?: string`
- `parserMode?: 'strict' | 'lenient'`

`parserMode` behavior:

- `strict` (default): throws on parser failures.
- `lenient`: returns fallback data and stores diagnostics in `getWarnings()`.

`strict`/`lenient` are standard parser-mode terms in open-source tooling.

## Node.js Example

```ts
import fs from 'fs'
import { Ofx } from 'ofx-data-extractor'

const file = fs.readFileSync('/path/to/file.ofx')
const ofx = Ofx.fromBuffer(file)

console.log(ofx.toJson())
```

## Browser Example (async `fromBlob`)

```ts
import { Ofx } from 'ofx-data-extractor'

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const ofx = await Ofx.fromBlob(file)
  console.log(ofx.toJson())
}
```

## `toJson()` vs `toNormalized()`

- `toJson()`: keeps structure close to OFX blocks.
- `toNormalized()`: returns product-ready transactions with normalized fields.

Normalized transaction fields:

- `source: 'bank' | 'credit_card'`
- `direction: 'credit' | 'debit'`
- `amount`
- `amountAbs`
- `postedAt`
- `description`
- `descriptionNormalized`
- `fitId`
- `currency`
- `account`
- `institution`
- `raw`
- `warnings`

Normalization options (`NormalizeOptions`):

- `amountMode?: 'string' | 'number' | 'cents'`
- `dateMode?: 'raw' | 'formatted' | 'iso' | 'date' | 'timestamp'`
- `formatDate?: string`

## Validation and Warnings

Use `validate()` for import checks and `getWarnings()` for parser diagnostics.

Example checks include:

- missing OFX block
- missing or duplicated FITID
- invalid amount
- invalid DTPOSTED
- no transactions found

## Date Handling Guarantees

Current date behavior is intentionally conservative and deterministic:

- OFX date strings are parsed using explicit rules (not implicit locale parsing).
- Date normalization uses UTC (`Date.UTC`) to avoid local-timezone drift.
- The parser accepts:
  - OFX compact datetime (`YYYYMMDDhhmmss`, with optional OFX timezone suffix)
  - `YYYY-MM-DD`
  - ISO datetime strings
- Invalid dates are rejected with warnings instead of silently coerced.
- Leap-year and date/time bounds are validated.

### Known Limits

- OFX timezone suffix offsets (e.g. `[-3:BRT]`) are currently ignored for arithmetic conversion and treated as metadata in the raw string.
- `dateMode: 'formatted'` is output-oriented and should not be used as canonical storage for downstream calculations.

### Future Improvements (Planned)

- Explicit offset-aware conversion for OFX timezone suffixes.
- Optional strict chronological validation against statement windows (`DTSTART`/`DTEND`).
- Optional canonical timestamp output with original offset metadata attached.

## Stability & API Surface

### Stable API (v1.x)

- `Ofx` class and its public methods documented above.

### Advanced/Internal API

The following exports are available for advanced integrations but are considered lower-level:

- `Extractor`
- `OfxExtractor`
- `Reader`
- parser helpers (`fixJsonProblems`, `formatDate`, etc.)

These are maintained for compatibility, but changes can happen faster than the `Ofx` facade.

### Deprecation Policy

- APIs are first documented as deprecated.
- Removals only occur in major releases.
- Migration guidance is always included in release notes.

## Versioning Policy

- `patch`: bug fixes without contract changes.
- `minor`: additive features and deprecations.
- `major`: breaking changes only.

## Upgrade Guide

### v1.5.0

- Added: `toNormalized(options?)`
- Added: `validate()`
- Added: `getWarnings()`
- Added: `parserMode: 'strict' | 'lenient'`
- Changed: transaction summary now works for bank-only and credit-card-only structures.

Adoption checklist:

1. Keep existing `toJson()` integrations unchanged.
2. Start using `toNormalized()` for product-facing transaction pipelines.
3. Enable `parserMode: 'lenient'` for user-upload flows and inspect `getWarnings()`.
4. Add `validate()` before persistence/import finalization.

## License

MIT

[license-image]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat
[license-url]: LICENSE
