import path from 'path'
import fs from 'fs'
import { Ofx, OfxDiagnostic } from '../src/index'
import './__mocks__/mockFileReader'

describe('Modern API additions', () => {
  const ofxFile = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))

  test('Should generate normalized transactions from both bank and credit card', () => {
    const ofx = Ofx.fromBuffer(ofxFile)
    const normalized = ofx.toNormalized()

    expect(normalized.transactions).toHaveLength(20)
    expect(normalized.warnings).toHaveLength(0)

    const transaction = normalized.transactions[0]
    expect(transaction).toHaveProperty('direction')
    expect(transaction).toHaveProperty('amount')
    expect(transaction).toHaveProperty('amountAbs')
    expect(transaction).toHaveProperty('postedAt')
    expect(transaction).toHaveProperty('fitId')
  })

  test('Should support amountMode and dateMode for normalization', () => {
    const normalized = Ofx.fromBuffer(ofxFile).toNormalized({
      amountMode: 'cents',
      dateMode: 'iso',
    })

    const transaction = normalized.transactions[0]
    expect(typeof transaction.amount).toBe('number')
    expect(String(transaction.postedAt)).toContain('T')
  })

  test('Should validate data and report diagnostics for malformed values', () => {
    const fileAsString = ofxFile.toString('utf-8')
    let fitIdCount = 0
    const malformed = fileAsString
      .replace(/<TRNAMT>[^\n<]+/, '<TRNAMT>invalid-value')
      .replace(/<DTPOSTED>[^\n<]+/, '<DTPOSTED>20181309000000')
      .replace(/<FITID>([^\n<]+)/g, (_match, fitId) => {
        fitIdCount += 1
        if (fitIdCount <= 2) return '<FITID>DUPLICATE-FITID'
        return `<FITID>${fitId}`
      })

    const report = new Ofx(malformed, { parserMode: 'lenient' }).validate()

    expect(report.isValid).toBe(false)
    expect(
      report.errors.some((error: OfxDiagnostic) => error.code === 'INVALID_AMOUNT'),
    ).toBe(true)
    expect(
      report.warnings.some(
        (warning: OfxDiagnostic) => warning.code === 'INVALID_DATE',
      ),
    ).toBe(true)
    expect(
      report.warnings.some(
        (warning: OfxDiagnostic) => warning.code === 'DUPLICATED_FITID',
      ),
    ).toBe(true)
  })

  test('Should not flag INVALID_DATE when configured date format is d/M/y', () => {
    const report = new Ofx(ofxFile.toString('utf-8'), {
      parserMode: 'lenient',
      formatDate: 'd/M/y',
    }).validate()

    expect(
      report.warnings.some(
        (warning: OfxDiagnostic) => warning.code === 'INVALID_DATE',
      ),
    ).toBe(false)
  })

  test('Should respect strict and lenient parser modes', () => {
    const brokenOfx = 'OFXHEADER:100\nDATA:OFXSGML\nVERSION:102\n<OFX><BROKEN>'

    expect(() => new Ofx(brokenOfx).toJson()).toThrow()

    const lenientParser = new Ofx(brokenOfx, { parserMode: 'lenient' })
    expect(() => lenientParser.toJson()).not.toThrow()
    expect(
      lenientParser
        .getWarnings()
        .some((warning: OfxDiagnostic) => warning.code === 'PARSE_ERROR'),
    ).toBe(true)
  })

  test('Should summarize credit card only files without throwing', () => {
    const creditCardOnlyFile = fs.readFileSync(path.resolve(__dirname, 'example3.ofx'))
    const summary = Ofx.fromBuffer(creditCardOnlyFile).getTransactionsSummary()

    expect(summary).toHaveProperty('credit')
    expect(summary).toHaveProperty('debit')
    expect(summary).toHaveProperty('amountOfCredits')
    expect(summary).toHaveProperty('amountOfDebits')
  })

  test('README browser snippet behavior should remain asynchronous', async () => {
    const blob = new Blob([ofxFile.toString()], { type: 'text/plain' })
    const ofx = await Ofx.fromBlob(blob)
    const summary = ofx.getTransactionsSummary()

    expect(summary.amountOfCredits).toBeGreaterThanOrEqual(1)
  })

  test('Should avoid prototype pollution when parsing suspicious keys', () => {
    const suspicious = [
      'OFXHEADER:100',
      'DATA:OFXSGML',
      'VERSION:102',
      '<OFX>',
      '<SIGNONMSGSRSV1>',
      '<SONRS>',
      '<STATUS>',
      '<CODE>0',
      '<SEVERITY>INFO',
      '</STATUS>',
      '<DTSERVER>20260101000000',
      '<LANGUAGE>ENG',
      '</SONRS>',
      '</SIGNONMSGSRSV1>',
      '<__proto__>',
      '<polluted>true',
      '</__proto__>',
      '</OFX>',
    ].join('\n')

    const result = new Ofx(suspicious, { parserMode: 'lenient' }).toJson() as any
    expect(({} as any).polluted).toBeUndefined()
    expect(result.OFX.__proto__).toBeDefined()
  })

  test('Should safely count FITID values even with prototype-like keys', () => {
    let fitIdCount = 0
    const withPrototypeLikeFitId = ofxFile
      .toString('utf-8')
      .replace(/<FITID>([^\n<]+)/g, (_match, fitId) => {
        fitIdCount += 1
        if (fitIdCount <= 2) return '<FITID>__proto__'
        return `<FITID>${fitId}`
      })

    const report = new Ofx(withPrototypeLikeFitId, { parserMode: 'lenient' }).validate()
    expect(report.warnings.some(warning => warning.code === 'DUPLICATED_FITID')).toBe(
      true,
    )
  })

  test('Should keep minimum performance baseline for normalization and validation', () => {
    const ofx = Ofx.fromBuffer(ofxFile)
    const startedAt = Date.now()
    for (let i = 0; i < 250; i++) {
      ofx.toNormalized()
      ofx.validate()
    }
    const elapsed = Date.now() - startedAt

    // Loose threshold to catch obvious regressions without flaky CI failures.
    expect(elapsed).toBeLessThan(5000)
  })
})
