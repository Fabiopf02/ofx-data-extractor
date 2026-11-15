# Migration Guide

## Current Recommended Adoption Flow

1. Keep existing `toJson()` integrations unchanged.
2. Introduce `toNormalized()` for product-facing transaction pipelines.
3. Use `validate()` before persistence/import finalization.
4. In user-upload flows, prefer `parserMode: 'lenient'` and inspect `getWarnings()`.

## Behavior Notes

### Character entities are decoded

Text values now have XML/SGML entities decoded (`<NAME>A &amp; B` -> `A & B`).
Supported: `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`, `&#NN;` and `&#xHH;`.
Decoding is single pass and unknown entities are kept as-is. Remove any manual
entity decoding in your code to avoid double decoding.

### `toNormalized()` dates

- `dateMode: 'raw'` returns the original OFX value (`20240102233045`), no longer a pre-formatted `y-M-d` date.
- `iso`, `date` and `timestamp` keep the time part of `DT*` fields.
- The `raw` property of each normalized transaction still uses the configured `formatDate`, matching `toJson()`.

### OFX 1.x (SGML) without line breaks

Bodies such as `<SEVERITY>INFO</STATUS>` or fully single-line SGML are now parsed
the same way as their multi-line equivalent.

## Contract Change Policy

When a contract needs to change:

1. Prefer additive behavior first.
2. Add migration notes and examples.
3. Clearly document breaking impact in release notes.
4. Provide fallback/deprecation period whenever possible.
