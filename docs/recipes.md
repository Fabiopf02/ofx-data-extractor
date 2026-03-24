# Recipes

## Node.js: Parse + Summary

```ts
import fs from 'fs'
import { Ofx } from 'ofx-data-extractor'

const file = fs.readFileSync('/path/to/file.ofx')
const ofx = Ofx.fromBuffer(file)

console.log(ofx.getTransactionsSummary())
```

## Browser: Async `fromBlob`

```ts
import { Ofx } from 'ofx-data-extractor'

async function handleFile(file: Blob) {
  const ofx = await Ofx.fromBlob(file)
  const data = ofx.toJson()
  return data
}
```

## Import Flow: Normalize + Validate + Diagnostics

```ts
import { Ofx } from 'ofx-data-extractor'

const ofx = new Ofx(ofxText, { parserMode: 'lenient' })
const normalized = ofx.toNormalized({ amountMode: 'number', dateMode: 'iso' })
const validation = ofx.validate()
const parserWarnings = ofx.getWarnings()

if (!validation.isValid) {
  throw new Error(`Invalid OFX: ${validation.errors.map(e => e.code).join(', ')}`)
}

console.log(normalized.transactions.length, parserWarnings.length)
```

## FITID Separated

```ts
import { Ofx } from 'ofx-data-extractor'

const list = new Ofx(ofxText, { fitId: 'separated' }).getBankTransferList()
console.log(list[0].FITID) // { date, transactionCode, protocol }
```
