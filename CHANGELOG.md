# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project follows Semantic Versioning.

## [Unreleased]

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
- Character entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;` and numeric references such as `&#39;`/`&#x27;`) are now decoded in text values returned by `toJson()`, `getContent()`, `getBankTransferList()`, `getCreditCardTransferList()` and `toNormalized()`. Unknown or malformed entities are left untouched. Example: `<NAME>A &amp; B` now yields `A & B` instead of `A &amp; B`.

### Fixed
- Browser README examples now use `await Ofx.fromBlob(...)`.
- OFX 1.x (SGML) bodies where a container closing tag directly follows an unclosed leaf (for example `<SEVERITY>INFO</STATUS>`, including fully single-line bodies) no longer throw `SyntaxError` in `toJson()`, `getContent()`, `getBankTransferList()` and `toNormalized()`. (#47, reported by @trackoor)
- `toNormalized()` no longer loses the time part of `DT*` fields: `dateMode: 'iso' | 'date' | 'timestamp'` keep `hh:mm:ss`, `dateMode: 'raw'` returns the original OFX value, and `dateMode: 'formatted'` honors time tokens passed through `NormalizeOptions.formatDate`. (#47)

### Deprecated
- None.

### Removed
- None.

### Migration Guide
- Existing `toJson()` integrations remain compatible.
- Prefer `toNormalized()` for application-level ingestion pipelines.
- For upload-based workflows, consider `parserMode: 'lenient'` + `getWarnings()`.
- Run `validate()` before persistence to enforce data quality rules.
- Text fields containing character entities are now returned decoded (`A &amp; B` -> `A & B`). If you decoded entities yourself, remove that step to avoid double decoding (for example `&amp;lt;` is now returned as `&lt;`).
- `dateMode: 'raw'` in `toNormalized()` now returns the original OFX value (for example `20240102233045`) instead of the `y-M-d` formatted date. The `raw` property of each normalized transaction keeps the configured `formatDate` output, as before.

### Breaking Changes
- None.
