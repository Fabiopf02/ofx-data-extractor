# Validation Guide

Use `validate()` to run structural and data checks before import/persistence.

## Basic Usage

```ts
import { Ofx } from 'ofx-data-extractor'

const report = new Ofx(ofxText, { parserMode: 'lenient' }).validate()
```

## Response Shape

```ts
type ValidationReport = {
  isValid: boolean
  warnings: OfxDiagnostic[]
  errors: OfxDiagnostic[]
  stats: {
    totalTransactions: number
    bankTransactions: number
    creditCardTransactions: number
    duplicatedFitIds: number
  }
}
```

## Current Check Types

- Missing OFX block
- Missing transactions
- Missing FITID
- Duplicated FITID
- Invalid amount
- Invalid date (`DTPOSTED`)

## Severity Semantics

- `errors` impact `isValid` (`isValid` is `false` when any error exists)
- `warnings` do not invalidate the report by default

If your domain requires stricter behavior (for example invalid dates as hard failure), apply an application-level rule on top of `warnings`.
