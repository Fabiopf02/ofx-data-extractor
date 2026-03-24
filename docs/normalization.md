# Normalization Guide

`toNormalized()` provides a product-oriented transaction list across bank and credit-card statements.

## Basic Usage

```ts
import { Ofx } from 'ofx-data-extractor'

const ofx = Ofx.fromBuffer(fileBuffer)
const normalized = ofx.toNormalized()
```

## Output Shape

Each transaction includes:

- `source`: `'bank' | 'credit_card'`
- `direction`: `'credit' | 'debit'`
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

Top-level output:

- `transactions: NormalizedTransaction[]`
- `warnings: OfxDiagnostic[]`

## `amountMode`

- `number` (default): numeric amount
- `string`: original string amount
- `cents`: integer cents

## `dateMode`

- `formatted` (default): parser-formatted date output
- `raw`: same value kept from parsed OFX payload
- `iso`: ISO datetime string
- `date`: JavaScript `Date`
- `timestamp`: Unix timestamp in milliseconds

## Invalid Date Handling

For `raw` and `formatted`, if a date is invalid:

- `postedAt` keeps the raw value
- transaction and top-level warnings include `INVALID_DATE`

For `iso`/`date`/`timestamp`, invalid dates produce `postedAt: null` and `INVALID_DATE`.
