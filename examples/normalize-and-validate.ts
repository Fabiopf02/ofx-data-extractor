import { Ofx } from 'ofx-data-extractor'

export function normalizeAndValidate(ofxText: string) {
  const ofx = new Ofx(ofxText, { parserMode: 'lenient' })

  const normalized = ofx.toNormalized({
    amountMode: 'number',
    dateMode: 'iso',
  })

  const validation = ofx.validate()
  const parserWarnings = ofx.getWarnings()

  return {
    normalized,
    validation,
    parserWarnings,
  }
}
