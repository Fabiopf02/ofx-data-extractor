import fs from 'fs'
import { Ofx } from 'ofx-data-extractor'

const file = fs.readFileSync('/path/to/file.ofx')
const ofx = Ofx.fromBuffer(file)

console.log('Type:', ofx.getType())
console.log('Summary:', ofx.getTransactionsSummary())
console.log('Transactions:', ofx.toNormalized().transactions.length)
