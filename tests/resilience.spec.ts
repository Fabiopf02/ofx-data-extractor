import path from 'path'
import fs from 'fs'
import { Ofx, OfxDiagnostic } from '../src/index'
import { parseDateParts, isValidParsedDate } from '../src/common/date'
import { normalizeOfxData, validateOfxData } from '../src/common/analysis'
import { Extractor } from '../src/implementations/extractor'
import { CustomExtractor } from '../src/interfaces/custom-extractor.interface'
import { Config } from '../src/common/config'
import { TransactionsSummary } from '../src/@types/common'

describe('Resilience and diagnostics behavior', () => {
  const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))
  const fileAsString = file.toString('utf-8')

  test('should emit MISSING_DATE warning when DTPOSTED is absent', () => {
    const normalized = normalizeOfxData({
      OFX: {
        SIGNONMSGSRSV1: { SONRS: { FI: { ORG: 'BANK', FID: '1' } } },
        BANKMSGSRSV1: {
          STMTTRNRS: {
            STMTRS: {
              CURDEF: 'BRL',
              BANKACCTFROM: { BANKID: '1', ACCTID: '2', ACCTTYPE: 'CHECKING' },
              BANKTRANLIST: {
                STMTTRN: [
                  {
                    TRNTYPE: 'DEBIT',
                    TRNAMT: '-10.00',
                    FITID: 'F1',
                    MEMO: 'no date',
                  },
                ],
              },
            },
          },
        },
      },
    } as any)
    expect(
      normalized.warnings.some((warning: OfxDiagnostic) => warning.code === 'MISSING_DATE'),
    ).toBe(true)
  })

  test('should support amountMode string', () => {
    const normalized = new Ofx(fileAsString).toNormalized({ amountMode: 'string' })
    expect(typeof normalized.transactions[0].amount).toBe('string')
  })

  test('should support dateMode raw', () => {
    const normalized = new Ofx(fileAsString).toNormalized({ dateMode: 'raw' })
    expect(typeof normalized.transactions[0].postedAt).toBe('string')
    expect(String(normalized.transactions[0].postedAt)).toContain('2018')
  })

  test('should emit INVALID_DATE and INVALID_AMOUNT with path', () => {
    const normalized = normalizeOfxData(
      {
        OFX: {
          BANKMSGSRSV1: {
            STMTTRNRS: {
              STMTRS: {
                CURDEF: 'BRL',
                BANKACCTFROM: { BANKID: '1', ACCTID: '2', ACCTTYPE: 'CHECKING' },
                BANKTRANLIST: {
                  STMTTRN: [
                    {
                      TRNTYPE: 'DEBIT',
                      DTPOSTED: 'invalid-date',
                      TRNAMT: 'invalid-amount',
                      FITID: 'X',
                    },
                  ],
                },
              },
            },
          },
        },
      } as any,
      { dateMode: 'iso' },
    )

    const invalidDate = normalized.warnings.find(
      (warning: OfxDiagnostic) => warning.code === 'INVALID_DATE',
    )
    const invalidAmount = normalized.warnings.find(
      (warning: OfxDiagnostic) => warning.code === 'INVALID_AMOUNT',
    )

    expect(invalidDate).toBeDefined()
    expect(invalidAmount).toBeDefined()
    expect(invalidDate?.path).toContain('BANKTRANLIST.0')
    expect(invalidAmount?.path).toContain('BANKTRANLIST.0')
  })

  test('should emit NO_TRANSACTIONS_FOUND on empty OFX body', () => {
    const data = [
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
      '</OFX>',
    ].join('\n')

    const report = new Ofx(data).validate()
    expect(
      report.warnings.some((w: OfxDiagnostic) => w.code === 'NO_TRANSACTIONS_FOUND'),
    ).toBe(true)
  })

  test('should emit MISSING_OFX_BLOCK when called with invalid root object', () => {
    const report = validateOfxData({} as any)
    expect(report.errors.some((e: OfxDiagnostic) => e.code === 'MISSING_OFX_BLOCK')).toBe(
      true,
    )
  })

  test('should emit MISSING_FITID when fitid is absent', () => {
    const mutated = fileAsString.replace(/<FITID>[^\n<]+/, '<FITID>')
    const report = new Ofx(mutated).validate()
    expect(report.warnings.some((w: OfxDiagnostic) => w.code === 'MISSING_FITID')).toBe(
      true,
    )
  })

  test('should reject non-finite date parts', () => {
    const parts = parseDateParts('2026-01-01')
    expect(parts).not.toBeNull()
    const corrupted = {
      ...(parts as any),
      year: Number.NaN,
    }
    expect(isValidParsedDate(corrupted)).toBe(false)
  })

  test('should preserve context for non-Error throws in lenient mode', () => {
    class ThrowingExtractor extends CustomExtractor {
      setConfig(config: Config): void {
        this.configInstance = config
      }
      getBankTransferList(): any {
        return []
      }
      getCreditCardTransferList(): any {
        return []
      }
      getTransactionsSummary(): TransactionsSummary {
        return {
          credit: 0,
          debit: 0,
          amountOfCredits: 0,
          amountOfDebits: 0,
          dateStart: '',
          dateEnd: '',
        }
      }
      getContent(): object {
        throw 'non-error-throw'
      }
    }

    const extractor = new Extractor(new ThrowingExtractor())
    extractor.config({ parserMode: 'lenient' })
    extractor.data({ getData: () => 'OFXHEADER:100\n<OFX>' } as any)

    expect(() => extractor.getContent()).not.toThrow()
    const warnings = extractor.getWarnings()
    expect(warnings.some(w => w.code === 'PARSE_ERROR')).toBe(true)
    expect(warnings.some(w => w.context === 'non-error-throw')).toBe(true)
  })

  test('should tolerate bank parse error and use credit-card fallback', () => {
    const malformedBankAndValidCard = [
      'OFXHEADER:100',
      'DATA:OFXSGML',
      'VERSION:102',
      '<OFX>',
      '<BANKMSGSRSV1>',
      '<STMTTRNRS>',
      '<STMTRS>',
      '<BANKTRANLIST>',
      '<STMTTRN>',
      '<TRNTYPE>DEBIT',
      '<TRNAMT>-100',
      '</STMTTRN>',
      // missing closures on purpose
      '<CREDITCARDMSGSRSV1>',
      '<CCSTMTTRNRS>',
      '<CCSTMTRS>',
      '<CURDEF>BRL',
      '<BANKTRANLIST>',
      '<DTSTART>20260101000000',
      '<DTEND>20260102000000',
      '<STMTTRN>',
      '<TRNTYPE>CREDIT',
      '<DTPOSTED>20260101120000',
      '<TRNAMT>25.00',
      '<FITID>CC1',
      '</STMTTRN>',
      '</BANKTRANLIST>',
      '</CCSTMTRS>',
      '</CCSTMTTRNRS>',
      '</CREDITCARDMSGSRSV1>',
      '</OFX>',
    ].join('\n')

    const summary = new Ofx(malformedBankAndValidCard, {
      parserMode: 'lenient',
    }).getTransactionsSummary()

    expect(summary.credit).toBeGreaterThanOrEqual(0)
    expect(summary.debit).toBeGreaterThanOrEqual(0)
  })

  test('should throw in strict mode when both summary sources fail to parse', () => {
    const malformedBankAndCard = [
      'OFXHEADER:100',
      'DATA:OFXSGML',
      'VERSION:102',
      '<OFX>',
      '<BANKMSGSRSV1>',
      '<STMTTRNRS>',
      '<STMTRS>',
      '<BANKTRANLIST>',
      '<STMTTRN>',
      '<TRNTYPE>DEBIT',
      '<TRNAMT>-100',
      '</STMTTRN>',
      '<CREDITCARDMSGSRSV1>',
      '<CCSTMTTRNRS>',
      '<CCSTMTRS>',
      '<BANKTRANLIST>',
      '<STMTTRN>',
      '<TRNTYPE>CREDIT',
      '<TRNAMT>25.00',
      // missing closures on purpose for both blocks
      '</OFX>',
    ].join('\n')

    expect(() => new Ofx(malformedBankAndCard).getTransactionsSummary()).toThrow()
  })
})
