import { Ofx } from 'ofx-data-extractor'

export async function readOfxFromBlob(file: Blob) {
  const ofx = await Ofx.fromBlob(file)
  return {
    headers: ofx.getHeaders(),
    summary: ofx.getTransactionsSummary(),
    validation: ofx.validate(),
  }
}
