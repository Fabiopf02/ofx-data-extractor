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

### Fixed
- Browser README examples now use `await Ofx.fromBlob(...)`.

### Deprecated
- None.

### Removed
- None.

### Migration Guide
- Existing `toJson()` integrations remain compatible.
- Prefer `toNormalized()` for application-level ingestion pipelines.
- For upload-based workflows, consider `parserMode: 'lenient'` + `getWarnings()`.
- Run `validate()` before persistence to enforce data quality rules.

### Breaking Changes
- None.
