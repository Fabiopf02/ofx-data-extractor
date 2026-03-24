# API Reference

This document focuses on the public `Ofx` facade.

## Constructor

```ts
new Ofx(data: string, config?: ExtractorConfig)
```

## Static Constructors

```ts
Ofx.fromBuffer(data: Buffer): Ofx
Ofx.fromBlob(data: Blob): Promise<Ofx>
```

## Core Methods

```ts
config(options: ExtractorConfig): this
getType(): Types
getHeaders(): MetaData
getBankTransferList(): StatementTransaction[]
getCreditCardTransferList(): StatementTransaction[]
getTransactionsSummary(): TransactionsSummary
getContent(): OfxStructure
toJson(): OfxResponse
toNormalized(options?: NormalizeOptions): NormalizedOfxData
validate(): ValidationReport
getWarnings(): OfxDiagnostic[]
```

## `ExtractorConfig`

```ts
type ExtractorConfig = {
  nativeTypes?: boolean
  fitId?: 'normal' | 'separated'
  formatDate?: string
  parserMode?: 'strict' | 'lenient'
}
```

## `NormalizeOptions`

```ts
type NormalizeOptions = {
  amountMode?: 'string' | 'number' | 'cents'
  dateMode?: 'raw' | 'formatted' | 'iso' | 'date' | 'timestamp'
  formatDate?: string
}
```

## Parser Mode Semantics

- `strict` (default): parser errors throw.
- `lenient`: parser errors fallback to safe defaults and diagnostics are stored in `getWarnings()`.

## Notes

- Prefer using the `Ofx` class for application code.
- Internal exports (`Extractor`, `OfxExtractor`, parser helpers) are available, but may evolve faster.
