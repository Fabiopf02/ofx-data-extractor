const { Ofx } = require('../dist')
const fs = require('node:fs')
const { resolve } = require('path')
const { deepStrictEqual, equal } = require('node:assert')

function main() {
  const fileData = fs.readFileSync(resolve(__dirname, 'example.ofx'))
  const output = fs.readFileSync(resolve(__dirname, 'output.json'), {
    encoding: 'utf8',
  })
  const ofx = new Ofx(fileData)
  deepStrictEqual(JSON.stringify(ofx.toJson(), null, 2), output)
  const summary = ofx.getTransactionsSummary()
  equal(summary.credit, 0)
  equal(summary.debit, 70370)
  equal(summary.amountOfCredits, 9)
  equal(summary.amountOfDebits, 9)
}
main()
