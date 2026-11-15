import { Ofx } from '../src/index'
import { buildBankOfx } from './helpers/ofx-builder'

const invalidDates = (ofx: Ofx) =>
  ofx.validate().warnings.filter(warning => warning.code === 'INVALID_DATE')

describe('validate() date checks use the original OFX value', () => {
  test.each(['y-M-d', 'd/M/y', 'M/d/y', 'yy', 'y.M.d', 'yyyy-MM-dd hh:mm:ss'])(
    'does not flag a valid DTPOSTED when formatDate is %s',
    formatDate => {
      const ofx = new Ofx(buildBankOfx(), { formatDate })
      expect(invalidDates(ofx)).toHaveLength(0)
      expect(ofx.validate().isValid).toBe(true)
    },
  )

  test.each(['y-M-d', 'M/d/y', 'yy'])(
    'still flags an impossible DTPOSTED when formatDate is %s',
    formatDate => {
      const ofx = new Ofx(buildBankOfx({ DTPOSTED: '20240231000000' }), {
        formatDate,
      })
      const warnings = invalidDates(ofx)
      expect(warnings).toHaveLength(1)
      expect(warnings[0].message).toContain('20240231000000')
    },
  )

  test('still flags a non-date DTPOSTED', () => {
    const ofx = new Ofx(buildBankOfx({ DTPOSTED: 'not-a-date' }), {
      formatDate: 'M/d/y',
    })
    expect(invalidDates(ofx)).toHaveLength(1)
  })

  test('works with date-only values and timezone suffixes', () => {
    for (const DTPOSTED of ['20240113', '20240113233045[-3:BRT]', '20240113233045.123']) {
      const ofx = new Ofx(buildBankOfx({ DTPOSTED }), { formatDate: 'M/d/y' })
      expect(invalidDates(ofx)).toHaveLength(0)
    }
  })

  test('keeps stats and other diagnostics unchanged', () => {
    const report = new Ofx(buildBankOfx(), { formatDate: 'yy' }).validate()
    expect(report.stats).toEqual({
      totalTransactions: 1,
      bankTransactions: 1,
      creditCardTransactions: 0,
      duplicatedFitIds: 0,
    })
    expect(report.errors).toEqual([])
    expect(report.warnings).toEqual([])
  })

  test('validate() does not leak raw dates into later calls', () => {
    const ofx = new Ofx(buildBankOfx(), { formatDate: 'd/M/y' })
    ofx.validate()
    const transactions = ofx.getBankTransferList()
    expect(transactions[0].DTPOSTED).toBe('13/01/2024')
    expect(ofx.toNormalized().transactions[0].postedAt).toBe('13/01/2024')
  })

  test('lenient mode still reports parse failures from validate()', () => {
    const broken = 'OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\n<OFX><BROKEN>'
    const ofx = new Ofx(broken, { parserMode: 'lenient' })
    expect(() => ofx.validate()).not.toThrow()
    expect(ofx.getWarnings().some(w => w.code === 'PARSE_ERROR')).toBe(true)
  })
})
