# Migration Guide

## Current Recommended Adoption Flow

1. Keep existing `toJson()` integrations unchanged.
2. Introduce `toNormalized()` for product-facing transaction pipelines.
3. Use `validate()` before persistence/import finalization.
4. In user-upload flows, prefer `parserMode: 'lenient'` and inspect `getWarnings()`.

## Contract Change Policy

When a contract needs to change:

1. Prefer additive behavior first.
2. Add migration notes and examples.
3. Clearly document breaking impact in release notes.
4. Provide fallback/deprecation period whenever possible.
