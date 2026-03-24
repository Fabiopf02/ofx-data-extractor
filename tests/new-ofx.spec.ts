import path from 'path'
import fs, { readFileSync } from 'fs'
import { Extractor } from '../src/implementations/extractor'
import { OfxExtractor } from '../src/implementations/ofx-extractor'
import { Reader } from '../src/implementations/reader'
import { Types } from '../src/@types/common'

const reader = new Reader()
const createExtractor = () => new Extractor(new OfxExtractor())

describe('Tests in the Node.js environment', () => {
  const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))

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
      const extractor = createExtractor()
      expect(extractor.data(data).getBankTransferList()).toHaveLength(18)
    },
  )

  test.concurrent(
    'It should return the correct amount of transactions: credit card',
    async () => {
      const file = readFileSync(path.resolve(__dirname, 'example.ofx'))
      const data = new Reader()
      const extractor = createExtractor()
      expect(
        extractor.data(data.fromBuffer(file)).getCreditCardTransferList(),
      ).toHaveLength(2)
    },
  )

  test.concurrent('Should correctly return transaction summary', () => {
    const data = Reader.fromString(file.toString())
    const extractor = createExtractor()
    const summary = extractor.data(data).getTransactionsSummary()
    expect(summary.credit).toBe(669.6)
    expect(summary.debit.toFixed(1)).toBe('34.1')
    expect(summary.amountOfCredits).toBe(9)
    expect(summary.amountOfDebits).toBe(9)
    expect(summary.dateStart).toBe('2018-01-30')
    expect(summary.dateEnd).toBe('2018-04-29')
  })

  test.concurrent('Should separate the FITID', () => {
    const extractor = createExtractor()
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
    const extractor = createExtractor()
    const date = extractor
      .data(reader.fromBuffer(file))
      .config({ formatDate: 'd/M/y' })
      .getBankTransferList()[0].DTPOSTED
    expect(date).toBe('09/03/2018')
  })

  test.concurrent('It should correctly return the offset and timezone', () => {
    const extractor = createExtractor()
    const transfer = extractor
      .data(reader.fromBuffer(file))
      .config({ nativeTypes: true })
      .getBankTransferList()[0]
    expect(typeof transfer.TRNAMT).toBe('number')
  })

  test.concurrent('Test without CreditCard', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example2.ofx'))
    const extractor = createExtractor()
    const extractorInstance = extractor.data(Reader.fromString(file.toString()))
    expect(
      extractorInstance.toJson().OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST
        .STRTTRN,
    ).toHaveLength(18)
  })
  test.concurrent('Test without CreditCard -> Transactions', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example2.ofx'))
    const extractor = createExtractor()
    const extractorInstance = extractor.data(Reader.fromBuffer(file))
    expect(extractorInstance.getCreditCardTransferList()).toHaveLength(0)
  })

  test.concurrent('Test without BANKMSGSRSV1 -> Transactions', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example3.ofx'))
    const extractor = createExtractor()
    const extractorInstance = extractor.data(Reader.fromBuffer(file))
    expect(extractorInstance.getBankTransferList()).toHaveLength(0)
  })

  test.concurrent('Should correctly return ofx type (bank)', () => {
    const data = Reader.fromString(file.toString())
    const extractor = createExtractor()
    expect(extractor.data(data).getType()).toBe(Types.BANK)
  })

  test.concurrent(
    'Should correctly return ofx type (credit card)',
    async () => {
      const file = readFileSync(path.resolve(__dirname, 'example3.ofx'))
      const extractor = createExtractor()
      const extractorInstance = extractor.data(Reader.fromBuffer(file))
      expect(extractorInstance.getType()).toBe(Types.CREDIT_CARD)
    },
  )

  test.concurrent('Should parse TRNUID with a date', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example4.ofx'))
    const extractor = createExtractor()
    const extractorInstance = extractor.data(Reader.fromBuffer(file))
    expect(extractorInstance.toJson()).not.toBeNull
  })

  test.concurrent('Should parse transactions with no STMTTRN', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example5.ofx'))
    const extractor = createExtractor()
    const extractorInstance = extractor.data(Reader.fromBuffer(file))
    expect(extractorInstance.toJson()).not.toBeNull
    expect(extractorInstance.getTransactionsSummary()).not.toBeNull
  })

  test.concurrent('Should return summary even without DTSTART/DTEND', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example5.ofx'))
    const withoutRange = file
      .toString()
      .replace(/<DTSTART>[^\n<]+/g, '')
      .replace(/<DTEND>[^\n<]+/g, '')
    const extractor = createExtractor()
    const extractorInstance = extractor.data(Reader.fromString(withoutRange))
    const summary = extractorInstance.getTransactionsSummary()
    expect(summary.dateStart).toBe('')
    expect(summary.dateEnd).toBe('')
  })

  test.concurrent(
    'Should use date range from the same statement block as summarized transactions',
    async () => {
      const file = readFileSync(path.resolve(__dirname, 'example.ofx'))
      const manipulated = file
        .toString()
        .replace('<BANKMSGSRSV1>', '<BANKMSGSRSV1_BROKEN>')
        .replace(/<DTSTART>[^\n<]+/, '<DTSTART>19990101000000')
        .replace(/<DTEND>[^\n<]+/, '<DTEND>19990131000000')
      const extractor = createExtractor()
      const summary = extractor.data(Reader.fromString(manipulated)).getTransactionsSummary()
      expect(summary.dateStart).toBe('2005-08-01')
      expect(summary.dateEnd).not.toBe('1999-01-31')
    },
  )
})
