import path from 'path'
import fs from 'fs'
import { Extractor } from '../src/implementations/extractor'
import { Ofx } from '../src/implementations/ofx'

const ofxExtractor = new Ofx()
const extractor = new Extractor(ofxExtractor)

describe('Tests in the Node.js environment', () => {
  const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))

  test('Should read file path', async () => {
    const ofx = await extractor.fromFilePath(
      path.resolve(__dirname, 'example.ofx'),
    )
    const headers = ofx.config({ nativeTypes: false }).getHeaders()
    expect(headers.OFXHEADER).toBe('100')
    expect(headers.CHARSET).toBe('1252')
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe('102')
  })

  test('Should read Buffer content', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))
    const headers = extractor
      .config({ nativeTypes: true })
      .fromBuffer(file)
      .getHeaders()
    expect(headers.OFXHEADER).toBe(100)
    expect(headers.CHARSET).toBe(1252)
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe(102)
  })

  test.concurrent('It should return the correct amount of transactions', () => {
    expect(extractor.fromBuffer(file).getBankTransferList()).toHaveLength(18)
  })

  test.concurrent('Should correctly return transaction summary', () => {
    const summary = extractor.fromBuffer(file).getTransactionsSummary()
    expect(summary.credit).toBe(669.6)
    expect(summary.debit.toFixed(1)).toBe('34.1')
    expect(summary.amountOfCredits).toBe(9)
    expect(summary.amountOfDebits).toBe(9)
    expect(summary.dateStart).toBe('2018-01-30')
    expect(summary.dateEnd).toBe('2018-04-29')
  })

  test.concurrent('It should be equal to the snapshot', () => {
    const jsonData = extractor.fromBuffer(file).toJson()
    expect(jsonData).toMatchSnapshot()
  })
  test.concurrent('It should be equal to the snapshot /2', async () => {
    const extractorInstance = await extractor.fromFilePath(
      path.resolve(__dirname, 'example.ofx'),
    )
    expect(extractorInstance.getContent()).toMatchSnapshot()
  })

  test.concurrent('Should separate the FITID', () => {
    const toCompare = extractor
      .fromString(file.toString())
      .getBankTransferList()[0]
    const result = extractor
      .fromBuffer(file)
      .config({ fitId: 'separated' })
      .getBankTransferList()[0].FITID as any
    expect(toCompare.FITID).toBe(
      result.date + result.transactionCode + result.protocol,
    )
  })

  test.concurrent('Should format the date correctly (d/M/y)', () => {
    const date = extractor
      .fromBuffer(file)
      .config({ formatDate: 'd/M/y' })
      .getBankTransferList()[0].DTPOSTED
    expect('09/03/2018').toBe(date)
  })

  test.concurrent('It should correctly return the offset and timezone', () => {
    const date = extractor
      .fromString(file.toString())
      .config({ formatDate: 'O TZ' })
      .getBankTransferList()[0].DTPOSTED
    expect('-3 BRT').toBe(date)
  })

  test.concurrent('It should correctly return the offset and timezone', () => {
    const transfer = extractor
      .fromBuffer(file)
      .config({ nativeTypes: true })
      .getBankTransferList()[0]
    expect(typeof transfer.TRNAMT).toBe('number')
  })
})
