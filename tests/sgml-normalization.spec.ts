import { Ofx } from '../src/index'

/**
 * Regression coverage for issue #47:
 *  1. single-line SGML (OFX 1.x) bodies
 *  2. toNormalized() losing the time part of DT* fields
 *  3. character entities not being decoded
 *
 * "Characterization" tests pin behavior that must NOT change with the fix.
 */

const HEADER = [
  'OFXHEADER:100',
  'DATA:OFXSGML',
  'VERSION:102',
  'SECURITY:NONE',
  'ENCODING:USASCII',
  'CHARSET:1252',
  'COMPRESSION:NONE',
  'OLDFILEUID:NONE',
  'NEWFILEUID:NONE',
  '',
].join('\n')

const bankBody = (name = 'A &amp; B') =>
  [
    '<OFX>',
    '<SIGNONMSGSRSV1>',
    '<SONRS>',
    '<STATUS>',
    '<CODE>0',
    '<SEVERITY>INFO',
    '</STATUS>',
    '<DTSERVER>20240105120000',
    '<LANGUAGE>POR',
    '</SONRS>',
    '</SIGNONMSGSRSV1>',
    '<BANKMSGSRSV1>',
    '<STMTTRNRS>',
    '<TRNUID>1',
    '<STATUS>',
    '<CODE>0',
    '<SEVERITY>INFO',
    '</STATUS>',
    '<STMTRS>',
    '<CURDEF>BRL',
    '<BANKACCTFROM>',
    '<BANKID>0341',
    '<ACCTID>12345',
    '<ACCTTYPE>CHECKING',
    '</BANKACCTFROM>',
    '<BANKTRANLIST>',
    '<DTSTART>20240101000000',
    '<DTEND>20240131000000',
    '<STMTTRN>',
    '<TRNTYPE>DEBIT',
    '<DTPOSTED>20240102233045',
    '<TRNAMT>-50.00',
    '<FITID>20240102001',
    `<NAME>${name}`,
    '</STMTTRN>',
    '<STMTTRN>',
    '<TRNTYPE>CREDIT',
    '<DTPOSTED>20240103080000',
    '<TRNAMT>10.00',
    '<FITID>20240103001',
    '<MEMO>second',
    '</STMTTRN>',
    '</BANKTRANLIST>',
    '<LEDGERBAL>',
    '<BALAMT>100.00',
    '<DTASOF>20240131',
    '</LEDGERBAL>',
    '</STMTRS>',
    '</STMTTRNRS>',
    '</BANKMSGSRSV1>',
    '</OFX>',
  ].join('\n')

const multiLine = (name?: string) => HEADER + '\n' + bankBody(name)
const singleLine = (name?: string) =>
  HEADER + '\n' + bankBody(name).replace(/\n/g, '')

describe('single-line SGML bodies (issue #47.1)', () => {
  test('toJson() on single-line SGML equals the multi-line result', () => {
    const expected = new Ofx(multiLine('plain')).toJson()
    expect(new Ofx(singleLine('plain')).toJson()).toEqual(expected)
  })

  test('getContent(), transfer lists and summary work on single-line SGML', () => {
    const multi = new Ofx(multiLine('plain'))
    const single = new Ofx(singleLine('plain'))
    expect(single.getContent()).toEqual(multi.getContent())
    expect(single.getBankTransferList()).toEqual(multi.getBankTransferList())
    expect(single.getTransactionsSummary()).toEqual(
      multi.getTransactionsSummary(),
    )
    expect(single.getBankTransferList()).toHaveLength(2)
  })

  test('toNormalized() and validate() work on single-line SGML', () => {
    const single = new Ofx(singleLine('plain'))
    expect(single.toNormalized().transactions).toHaveLength(2)
    expect(single.validate().isValid).toBe(true)
  })

  test('container closing tag right after a leaf closes the container', () => {
    const result = new Ofx(singleLine('plain')).toJson() as any
    expect(result.OFX.SIGNONMSGSRSV1.SONRS.STATUS).toEqual({
      CODE: '0',
      SEVERITY: 'INFO',
    })
    expect(result.OFX.SIGNONMSGSRSV1.SONRS.LANGUAGE).toBe('POR')
  })

  test('partially joined SGML (mixed line breaks) parses the same', () => {
    const mixed = HEADER + '\n' + bankBody('plain').replace(/\n(?=<\/)/g, '')
    expect(new Ofx(mixed).toJson()).toEqual(new Ofx(multiLine('plain')).toJson())
  })

  test('single-line XML (OFX 2.x) keeps parsing the same as before', () => {
    const xml =
      '<?xml version="1.0" encoding="US-ASCII"?><?OFX OFXHEADER="200" VERSION="211" SECURITY="NONE" OLDFILEUID="NONE" NEWFILEUID="NONE"?>' +
      '<OFX><SIGNONMSGSRSV1><SONRS><STATUS><CODE>0</CODE><SEVERITY>INFO</SEVERITY></STATUS><DTSERVER>20240517120000</DTSERVER></SONRS></SIGNONMSGSRSV1>' +
      '<BANKMSGSRSV1><STMTTRNRS><TRNUID>1</TRNUID><STMTRS><CURDEF>USD</CURDEF><BANKTRANLIST>' +
      '<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20240515120000</DTPOSTED><TRNAMT>-11.79</TRNAMT><FITID>1</FITID><NAME>Example</NAME></STMTTRN>' +
      '</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>'
    const result = new Ofx(xml).toJson() as any
    expect(result.OFX.SIGNONMSGSRSV1.SONRS.STATUS).toEqual({
      CODE: '0',
      SEVERITY: 'INFO',
    })
    expect(
      result.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STRTTRN,
    ).toEqual([
      {
        TRNTYPE: 'DEBIT',
        DTPOSTED: '2024-05-15',
        TRNAMT: '-11.79',
        FITID: '1',
        NAME: 'Example',
      },
    ])
  })
})

describe('toNormalized() keeps the time of DT* fields (issue #47.2)', () => {
  const ofx = () => new Ofx(multiLine('plain'))
  const postedAt = (options: Parameters<Ofx['toNormalized']>[0]) =>
    ofx().toNormalized(options).transactions[0].postedAt

  test('iso keeps hh:mm:ss', () => {
    expect(postedAt({ dateMode: 'iso' })).toBe('2024-01-02T23:30:45.000Z')
  })

  test('date keeps hh:mm:ss', () => {
    expect((postedAt({ dateMode: 'date' }) as Date).toISOString()).toBe(
      '2024-01-02T23:30:45.000Z',
    )
  })

  test('timestamp keeps hh:mm:ss', () => {
    expect(postedAt({ dateMode: 'timestamp' })).toBe(
      Date.UTC(2024, 0, 2, 23, 30, 45),
    )
  })

  test('raw returns the original OFX value', () => {
    expect(postedAt({ dateMode: 'raw' })).toBe('20240102233045')
  })

  test('formatted honors time tokens from NormalizeOptions.formatDate', () => {
    expect(
      postedAt({ dateMode: 'formatted', formatDate: 'yyyy-MM-dd hh:mm:ss' }),
    ).toBe('2024-01-02 23:30:45')
  })

  test('formatted honors time tokens from the constructor formatDate', () => {
    const normalized = new Ofx(multiLine('plain'), {
      formatDate: 'yyyy-MM-dd hh:mm:ss',
    }).toNormalized({ dateMode: 'formatted' })
    expect(normalized.transactions[0].postedAt).toBe('2024-01-02 23:30:45')
  })

  test('date-only values (DTASOF style) still work in every mode', () => {
    const body = multiLine('plain').replace('20240102233045', '20240102')
    const normalize = (dateMode: any) =>
      new Ofx(body).toNormalized({ dateMode }).transactions[0].postedAt
    expect(normalize('iso')).toBe('2024-01-02T00:00:00.000Z')
    expect(normalize('raw')).toBe('20240102')
    expect(normalize('formatted')).toBe('2024-01-02')
  })

  // ---- characterization: must keep working after the fix ----

  test('default formatted mode still outputs y-M-d', () => {
    expect(ofx().toNormalized().transactions[0].postedAt).toBe('2024-01-02')
  })

  test('constructor formatDate still drives the default formatted output', () => {
    const normalized = new Ofx(multiLine('plain'), {
      formatDate: 'd/M/y',
    }).toNormalized()
    expect(normalized.transactions[0].postedAt).toBe('02/01/2024')
  })

  test('toJson() and getBankTransferList() keep configured date formatting', () => {
    const json = ofx().toJson() as any
    const list = json.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STRTTRN
    expect(list[0].DTPOSTED).toBe('2024-01-02')
    expect(ofx().getBankTransferList()[0].DTPOSTED).toBe('2024-01-02')
    expect(json.OFX.SIGNONMSGSRSV1.SONRS.DTSERVER).toBe('2024-01-05')
  })

  test('normalized `raw` transaction keeps the configured date format', () => {
    const normalized = ofx().toNormalized({ dateMode: 'iso' })
    expect((normalized.transactions[0].raw as any).DTPOSTED).toBe('2024-01-02')
  })

  test('calling toNormalized() does not leak into later toJson() calls', () => {
    const instance = ofx()
    instance.toNormalized({ dateMode: 'raw' })
    const json = instance.toJson() as any
    expect(
      json.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STRTTRN[0].DTPOSTED,
    ).toBe('2024-01-02')
  })

  test('toNormalized() does not leak into later toNormalized() calls', () => {
    const instance = ofx()
    expect(instance.toNormalized({ dateMode: 'raw' }).transactions[0].postedAt).toBe(
      '20240102233045',
    )
    expect(instance.toNormalized().transactions[0].postedAt).toBe('2024-01-02')
  })

  test('invalid DTPOSTED is still kept as-is with INVALID_DATE', () => {
    const body = multiLine('plain').replace('20240102233045', '20240231000000')
    const normalized = new Ofx(body).toNormalized({ dateMode: 'iso' })
    expect(normalized.warnings.some(w => w.code === 'INVALID_DATE')).toBe(true)
  })
})

describe('character entities (issue #47.3)', () => {
  test('NAME/MEMO entities are decoded by toJson() and getBankTransferList()', () => {
    const body = multiLine('A &amp; B &lt;x&gt; &quot;q&quot; it&apos;s')
    const expected = 'A & B <x> "q" it\'s'
    const json = new Ofx(body).toJson() as any
    expect(
      json.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STRTTRN[0].NAME,
    ).toBe(expected)
    expect(new Ofx(body).getBankTransferList()[0].NAME).toBe(expected)
  })

  test('toNormalized() description is decoded', () => {
    const normalized = new Ofx(multiLine('A &amp; B')).toNormalized()
    expect(normalized.transactions[0].description).toBe('A & B')
  })

  test('decoding is single pass (&amp;lt; becomes &lt;, not <)', () => {
    const json = new Ofx(multiLine('&amp;lt;')).getBankTransferList()
    expect(json[0].NAME).toBe('&lt;')
  })

  test('decoded markup-like text does not corrupt the parsed structure', () => {
    const body = multiLine('&lt;b&gt;bold&lt;/b&gt; x, &quot;y&quot;')
    const list = new Ofx(body).getBankTransferList()
    expect(list).toHaveLength(2)
    expect(list[0].NAME).toBe('<b>bold</b> x, "y"')
    expect(list[1].MEMO).toBe('second')
  })

  test('numeric character references are decoded', () => {
    const list = new Ofx(multiLine('it&#39;s &#x41;')).getBankTransferList()
    expect(list[0].NAME).toBe("it's A")
  })

  test('single-line SGML decodes entities too', () => {
    const list = new Ofx(singleLine('A &amp; B')).getBankTransferList()
    expect(list[0].NAME).toBe('A & B')
  })

  test('unknown or malformed entities are left untouched', () => {
    const list = new Ofx(
      multiLine('AT&T &unknown; &amp &#xZZ; &#99999999;'),
    ).getBankTransferList()
    expect(list[0].NAME).toBe('AT&T &unknown; &amp &#xZZ; &#99999999;')
  })

  test('amounts, FITID and dates are not altered by entity decoding', () => {
    const [first] = new Ofx(multiLine('x')).getBankTransferList()
    expect(first.TRNAMT).toBe('-50.00')
    expect(first.FITID).toBe('20240102001')
  })
})
