import { Ofx } from '../src/index'
import { buildBankOfx } from './helpers/ofx-builder'

const STYLES = ['sgml', 'xml'] as const

const SPECIAL_VALUES = [
  'x {a}, b',
  '{x}',
  'a}',
  '{a',
  'ref [1]',
  'a]',
  '[x]',
  'cost },',
  'a,}',
  'a, }',
  '{"k":"v"}',
  '[1,2,3]',
  '}{][',
  'a}"b',
  'a]"b',
  'x,",y',
  'back\\slash',
  'quote "inside"',
  'trailing comma,',
]

describe('structural characters in text values are preserved', () => {
  describe.each(STYLES)('%s leaves', style => {
    test.each(SPECIAL_VALUES)('getBankTransferList() keeps %j', value => {
      const [transaction] = new Ofx(
        buildBankOfx({ NAME: value }, style),
      ).getBankTransferList()
      expect(transaction.NAME).toBe(value)
    })

    test.each(SPECIAL_VALUES)('toJson() keeps %j', value => {
      const json = new Ofx(buildBankOfx({ NAME: value }, style)).toJson() as any
      const [transaction] =
        json.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STRTTRN
      expect(transaction.NAME).toBe(value)
    })

    test.each(SPECIAL_VALUES)('toNormalized() description keeps %j', value => {
      const [transaction] = new Ofx(
        buildBankOfx({ MEMO: value }, style),
      ).toNormalized().transactions
      expect(transaction.description).toBe(value)
    })
  })

  test('other fields of the same transaction are not affected', () => {
    const [transaction] = new Ofx(
      buildBankOfx({ NAME: 'x {a}, b]', MEMO: 'm}' }),
    ).getBankTransferList()
    expect(transaction.TRNAMT).toBe('-5.00')
    expect(transaction.FITID).toBe('1')
    expect(transaction.TRNTYPE).toBe('DEBIT')
    expect(transaction.DTPOSTED).toBe('2024-01-13')
    expect(transaction.MEMO).toBe('m}')
  })

  test('summary and validation still work with special characters', () => {
    const ofx = new Ofx(buildBankOfx({ NAME: '{x}, [y]' }))
    expect(ofx.getTransactionsSummary().amountOfDebits).toBe(1)
    expect(ofx.validate().isValid).toBe(true)
  })

  test('entities that decode to structural characters are preserved', () => {
    const [transaction] = new Ofx(
      buildBankOfx({ NAME: '&#123;a&#125;, &#91;b&#93;' }),
    ).getBankTransferList()
    expect(transaction.NAME).toBe('{a}, [b]')
  })

  test('single-line SGML keeps special characters', () => {
    const singleLine = buildBankOfx({ NAME: '{x}, [y]' }).replace(/\n(?=<)/g, '')
    expect(new Ofx(singleLine).getBankTransferList()[0].NAME).toBe('{x}, [y]')
  })

  // ---- characterization: must keep working after the fix ----

  test('nativeTypes still converts numeric values', () => {
    const [transaction] = new Ofx(buildBankOfx(), {
      nativeTypes: true,
    }).getBankTransferList()
    expect(transaction.TRNAMT).toBe(-5)
    expect(transaction.FITID).toBe('1')
  })

  test('fitId separated still works', () => {
    const [transaction] = new Ofx(
      buildBankOfx({ FITID: '202401130001ABCDEFGH123456' }),
      { fitId: 'separated' },
    ).getBankTransferList()
    expect(transaction.FITID).toEqual({
      date: '202401130001',
      transactionCode: 'ABCDEFG',
      protocol: 'H123456',
    })
  })

  test('multiple transactions keep their order and values', () => {
    const base = buildBankOfx({ NAME: 'first {1}' })
    const second = buildBankOfx({ NAME: 'second [2]', FITID: '2' })
    const transactionBlock = (text: string) =>
      text.slice(text.indexOf('<STMTTRN>'), text.indexOf('</STMTTRN>') + 10)
    const combined = base.replace(
      '</BANKTRANLIST>',
      `${transactionBlock(second)}\n</BANKTRANLIST>`,
    )
    const list = new Ofx(combined).getBankTransferList()
    expect(list.map((t: any) => t.NAME)).toEqual(['first {1}', 'second [2]'])
    expect(list.map((t: any) => t.FITID)).toEqual(['1', '2'])
  })

  test('dates with a timezone suffix keep working in every mode', () => {
    const body = buildBankOfx({ DTPOSTED: '20240113233045[-3:BRT]' })
    const postedAt = (options: Parameters<Ofx['toNormalized']>[0]) =>
      new Ofx(body).toNormalized(options).transactions[0].postedAt
    expect(postedAt({ dateMode: 'raw' })).toBe('20240113233045[-3:BRT]')
    expect(postedAt({ dateMode: 'iso' })).toBe('2024-01-13T23:30:45.000Z')
    expect(postedAt({})).toBe('2024-01-13')
    expect(new Ofx(body).getBankTransferList()[0].DTPOSTED).toBe('2024-01-13')
    expect(new Ofx(body).validate().isValid).toBe(true)
  })

  test('brackets in summary range dates do not break getTransactionsSummary', () => {
    const summary = new Ofx(buildBankOfx({ NAME: '[x]' })).getTransactionsSummary()
    expect(summary.amountOfDebits).toBe(1)
  })
})
