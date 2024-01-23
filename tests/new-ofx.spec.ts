import path from 'path'
import fs from 'fs'
import { Extractor } from '../src/implementations/extractor'
import { OfxExtractor } from '../src/implementations/ofx-extractor'
import { Reader } from '../src/implementations/reader'

const ofxExtractor = new OfxExtractor()
const reader = new Reader()
const extractor = new Extractor(ofxExtractor)

describe('Tests in the Node.js environment', () => {
  const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))

  test('Should read file path', async () => {
    const data = await Reader.fromFilePath(
      path.resolve(__dirname, 'example.ofx'),
    )
    const ofx = extractor.data(data)
    const headers = ofx.config({ nativeTypes: false }).getHeaders()
    expect(headers.OFXHEADER).toBe('100')
    expect(headers.CHARSET).toBe('1252')
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe('102')
  })

  test('Should read Buffer content', async () => {
    const extractor = new Extractor()
    const data = Reader.fromBuffer(
      fs.readFileSync(path.resolve(__dirname, 'example.ofx')),
    )
    const headers = extractor
      .data(data)
      .config({ nativeTypes: true })
      .getHeaders()
    expect(headers.OFXHEADER).toBe(100)
    expect(headers.CHARSET).toBe(1252)
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe(102)
  })

  test.concurrent(
    'It should return the correct amount of transactions: bank transfer',
    () => {
      const data = new Reader().fromBuffer(file)
      expect(extractor.data(data).getBankTransferList()).toHaveLength(18)
    },
  )

  test.concurrent(
    'It should return the correct amount of transactions: credit card',
    async () => {
      const data = new Reader()
      expect(
        extractor
          .data(await data.fromFilePath(path.resolve(__dirname, 'example.ofx')))
          .getCreditCardTransferList(),
      ).toHaveLength(2)
    },
  )

  test.concurrent('Should correctly return transaction summary', () => {
    const data = Reader.fromString(file.toString())
    const summary = extractor.data(data).getTransactionsSummary()
    expect(summary.credit).toBe(669.6)
    expect(summary.debit.toFixed(1)).toBe('34.1')
    expect(summary.amountOfCredits).toBe(9)
    expect(summary.amountOfDebits).toBe(9)
    expect(summary.dateStart).toBe('2018-01-30')
    expect(summary.dateEnd).toBe('2018-04-29')
  })

  test.concurrent('Should separate the FITID', () => {
    const toCompare = extractor
      .data(reader.fromString(file.toString()))
      .getBankTransferList()[0]
    const result = extractor
      .data(reader.fromBuffer(file))
      .config({ fitId: 'separated' })
      .getBankTransferList()[0].FITID as any
    expect(toCompare.FITID).toBe(
      result.date + result.transactionCode + result.protocol,
    )
  })

  test.concurrent('Should format the date correctly (d/M/y)', () => {
    const date = extractor
      .data(reader.fromBuffer(file))
      .config({ formatDate: 'd/M/y' })
      .getBankTransferList()[0].DTPOSTED
    expect(date).toBe('09/03/2018')
  })

  test.concurrent('It should correctly return the offset and timezone', () => {
    const transfer = extractor
      .data(reader.fromBuffer(file))
      .config({ nativeTypes: true })
      .getBankTransferList()[0]
    expect(typeof transfer.TRNAMT).toBe('number')
  })

  test.concurrent('Test without CreditCard', async () => {
    const data = await Reader.fromFilePath(
      path.resolve(__dirname, 'example2.ofx'),
    )
    const extractorInstance = extractor.data(data)
    expect(
      extractorInstance.toJson().OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST
        .STRTTRN,
    ).toHaveLength(18)
  })
  test.concurrent('Test without CreditCard -> Transactions', async () => {
    const data = await Reader.fromFilePath(
      path.resolve(__dirname, 'example2.ofx'),
    )
    const extractorInstance = extractor.data(data)
    expect(extractorInstance.getCreditCardTransferList()).toHaveLength(0)
  })
})
