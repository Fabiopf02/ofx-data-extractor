# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

Versions are listed from the most recent to the oldest. Inside each version, sections
list the newest change first. Releases before 1.3.0 are only available as git tags.

## [Unreleased]

### Fixed
- 2026-11-15 — Text values containing `{`, `}`, `[` or `]` are no longer altered. Previously `x {a}, b` became `x a b`, `{x}` became `x},` and values ending in `]` or `}` (for example `ref [1]`) gained a stray comma. The same applies to `toJson()`, `getContent()`, `getBankTransferList()`, `getCreditCardTransferList()` and `toNormalized()`, for SGML and XML.
- 2026-11-15 — `validate()` no longer reports false `INVALID_DATE` warnings when `formatDate` produces a layout the date parser cannot read back (for example `M/d/y`, `yy`, `y.M.d` or `yyyy-MM-dd hh:mm:ss`). Dates are now validated from the original OFX value. Truly invalid dates are still reported, and the warning message now shows the original value instead of the formatted one.
- 2026-11-15 — `toNormalized()` no longer loses the time part of `DT*` fields: `dateMode: 'iso' | 'date' | 'timestamp'` keep `hh:mm:ss`, `dateMode: 'raw'` returns the original OFX value, and `dateMode: 'formatted'` honors time tokens passed through `NormalizeOptions.formatDate`. (#47)
- 2026-11-15 — OFX 1.x (SGML) bodies where a container closing tag directly follows an unclosed leaf (for example `<SEVERITY>INFO</STATUS>`, including fully single-line bodies) no longer throw `SyntaxError` in `toJson()`, `getContent()`, `getBankTransferList()` and `toNormalized()`. (#47, reported by @trackoor)

### Changed
- 2026-11-15 — Character entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;` and numeric references such as `&#39;`/`&#x27;`) are now decoded in text values returned by `toJson()`, `getContent()`, `getBankTransferList()`, `getCreditCardTransferList()` and `toNormalized()`. Unknown or malformed entities are left untouched. Example: `<NAME>A &amp; B` now yields `A & B` instead of `A &amp; B`. (#47)

### Migration Guide
- Text fields containing character entities are now returned decoded. If you decoded entities yourself, remove that step to avoid double decoding (for example `&amp;lt;` is now returned as `&lt;`).
- Text values that contained `{ } [ ]` used to be returned altered (see Fixed). If you worked around it, the workaround can be removed.
- `toNormalized({ dateMode: 'raw' })` now returns the original OFX value (for example `20240102233045`) instead of the `y-M-d` formatted date. The `raw` property of each normalized transaction keeps the configured `formatDate` output, as before.

### Breaking Changes
- None.

## [1.5.0] - 2026-03-24

### Highlights
- Introduced a new normalized output API for product-facing transaction flows.
- Added validation and diagnostics APIs for safer import pipelines.
- Added parser `strict`/`lenient` behavior with warning collection.

### Added
- `Ofx#toNormalized(options?)`
- `Ofx#validate()`
- `Ofx#getWarnings()`
- `parserMode: 'strict' | 'lenient'` in `ExtractorConfig`
- New normalization and validation types exported from package entrypoint.

### Changed
- `getTransactionsSummary()` now supports credit-card-only structures in addition to bank statements.
- Package metadata updated (`repository`, `bugs`, and `exports`).
- Build pipeline optimized and toolchain refreshed.
- Documentation split into developer guides (`docs/`) and a streamlined README.

### Fixed
- `getWarnings()` is scoped to parser failures and no longer mixes validation errors.
- Invalid `DTPOSTED` values are flagged (`INVALID_DATE`) in normalized output.
- Date validation hardened and summary date range selection corrected.
- Browser README examples now use `await Ofx.fromBlob(...)`.

### Migration Guide
- Existing `toJson()` integrations remain compatible.
- Prefer `toNormalized()` for application-level ingestion pipelines.
- For upload-based workflows, consider `parserMode: 'lenient'` + `getWarnings()`.
- Run `validate()` before persistence to enforce data quality rules.

### Breaking Changes
- None.

## [1.4.8] - 2025-05-27

### Fixed
- Parsing files with no `STMTTRN` elements, including `getTransactionsSummary()` on such files.

## [1.4.7] - 2025-02-12

### Fixed
- `fixJsonProblems` no longer drops double quotes.

## [1.4.6] - 2025-01-24

### Fixed
- Arbitrary keys are supported in all parsed objects (types).

## [1.4.5] - 2025-01-19

### Fixed
- Type definitions.

## [1.4.4] - 2024-12-04

### Fixed
- Regular expressions used by the parser.

## [1.4.3] - 2024-12-03

### Added
- Exposed a function to get the type of OFX transactions.

### Changed
- Improved identification of operation/transaction types.

### Fixed
- Parsing files formatted as a single line (XML).

## [1.4.2] - 2024-11-27

### Fixed
- Re-release of the 1.4.1 fixes (same changes, listed below).

## [1.4.1] - 2024-11-27

### Fixed
- Resulting JSON when tag order differs after the transfer lists.
- Conversion of content containing quotation marks.
- Debit/credit calculations in `getTransactionsSummary()`.

### Documentation
- Documented the method to list credit card transactions.

## [1.4.0] - 2024-05-19

### Added
- Headers are parsed from XML-based OFX files.

### Fixed
- Parsing failing when `<BANKMSGSRSV1>` is missing.

## [1.3.5] - 2024-05-02

### Fixed
- Type import in the build output.

## [1.3.4] - 2024-02-14

### Removed
- `fromFilePath` from the reader.

## [1.3.3] - 2024-01-31

### Changed
- Maintenance release.

## [1.3.2] - 2024-01-23

### Fixed
- Existence of credit card data is checked before converting it to an object.

### Documentation
- Added `CONTRIBUTING.md` and issue templates.

## [1.3.1] - 2023-11-10

### Fixed
- Lint issue (shadowed variable).

## [1.3.0] - 2023-11-10

### Added
- Support for `CREDITCARDMSGSRSV1`.
- The custom extractor is now optional in the constructor.

### Fixed
- Backslash escaping (#10).

### Changed
- Internal refactor of the extraction functions.
