/**
 * Builds a minimal bank statement with a single transaction, in OFX 1.x (SGML)
 * or OFX 2.x (XML) leaf style, so tests can vary one field at a time.
 */
export function buildBankOfx(
  fields: Partial<Record<'DTPOSTED' | 'TRNAMT' | 'FITID' | 'NAME' | 'MEMO', string>> = {},
  style: 'sgml' | 'xml' = 'sgml',
) {
  const leaf = (tag: string, value: string) =>
    style === 'xml' ? `<${tag}>${value}</${tag}>` : `<${tag}>${value}\n`
  const transaction = {
    TRNTYPE: 'DEBIT',
    DTPOSTED: '20240113233045',
    TRNAMT: '-5.00',
    FITID: '1',
    NAME: 'plain',
    ...fields,
  }
  const body = Object.entries(transaction)
    .map(([tag, value]) => leaf(tag, value))
    .join('')
  return [
    'OFXHEADER:100',
    'DATA:OFXSGML',
    'VERSION:102',
    '',
    '<OFX>',
    '<BANKMSGSRSV1>',
    '<STMTTRNRS>',
    '<STMTRS>',
    '<BANKTRANLIST>',
    '<STMTTRN>',
    body + '</STMTTRN>',
    '</BANKTRANLIST>',
    '</STMTRS>',
    '</STMTTRNRS>',
    '</BANKMSGSRSV1>',
    '</OFX>',
  ].join('\n')
}
