import { Ofx } from '../src/index'
import path from 'path'
import fs from 'fs'
import { Types } from '../src/@types/common'

describe('Tests in the Node.js environment', () => {
  const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))
  const ofx = Ofx.fromBuffer(file)

  test('It should read Buffer content', async () => {
    const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))
    const ofx = Ofx.fromBuffer(file)
    const headers = ofx.getHeaders()
    expect(headers.OFXHEADER).toBe('100')
    expect(headers.CHARSET).toBe('1252')
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe('102')
  })

  test.concurrent('It should return the correct amount of transactions', () => {
    expect(ofx.getBankTransferList()).toHaveLength(18)
  })

  test.concurrent(
    'It should return the correct amount of credit card transactions',
    () => {
      expect(ofx.getCreditCardTransferList()).toHaveLength(2)
    },
  )

  test.concurrent('Should correctly return transaction summary', () => {
    const summary = ofx.getTransactionsSummary()
    expect(summary.credit).toBe(669.6)
    expect(summary.debit.toFixed(1)).toBe('34.1')
    expect(summary.amountOfCredits).toBe(9)
    expect(summary.amountOfDebits).toBe(9)
    expect(summary.dateStart).toBe('2018-01-30')
    expect(summary.dateEnd).toBe('2018-04-29')
  })

  test.concurrent('It should be equal to the snapshot', () => {
    const jsonData = ofx.toJson()
    expect(jsonData).toMatchSnapshot()
  })
  test.concurrent('It should be equal to the snapshot /2', () => {
    expect(ofx.getContent()).toMatchSnapshot()
  })

  test.concurrent('Should separate the FITID', () => {
    const toCompare = ofx.getBankTransferList()[0]
    const result = ofx.config({ fitId: 'separated' }).getBankTransferList()[0]
      .FITID as any
    expect(toCompare.FITID).toBe(
      result.date + result.transactionCode + result.protocol,
    )
  })

  test.concurrent('Should format the date correctly (d/M/y)', () => {
    const date = ofx
      .config({ formatDate: 'd/M/y' })
      .getBankTransferList()[0].DTPOSTED
    expect(date).toBe('09/03/2018')
  })

  test.concurrent('It should correctly return the offset and timezone', () => {
    const transfer = ofx.config({ nativeTypes: true }).getBankTransferList()[0]
    expect(typeof transfer.TRNAMT).toBe('number')
  })

  test.concurrent('Should correctly return transaction summary', () => {
    const summary = ofx.getTransactionsSummary()
    expect(summary.credit.toFixed(1)).toBe('669.6')
    expect(summary.debit.toFixed(1)).toBe('34.1')
    expect(summary.amountOfCredits).toBe(9)
    expect(summary.amountOfDebits).toBe(9)
    expect(summary.dateStart).toBe('2018-01-30')
    expect(summary.dateEnd).toBe('2018-04-29')
  })

  test.concurrent('Should correctly return ofx type (bank)', () => {
    expect(ofx.getType()).toBe(Types.BANK)
  })

  test.concurrent('Should correctly read an online ofx', () => {
    const file = fs.readFileSync(path.resolve(__dirname, 'inline.ofx'))
    const ofx = Ofx.fromBuffer(file)
    const headers = ofx.getHeaders()

    expect(ofx.toJson()).toMatchSnapshot()

    expect(headers.VERSION).toBe('211')
    expect(headers.ENCODING).toBe('US-ASCII')
    expect(headers.OFXHEADER).toBe('200')
    expect(headers.SECURITY).toBe('NONE')
    expect(headers.OLDFILEUID).toBe('NONE')
    expect(headers.NEWFILEUID).toBe('NONE')
  })
})
