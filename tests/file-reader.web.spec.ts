import { Ofx, Reader } from '../src/index'
import path from 'path'
import fs from 'fs'
import { blobToString } from '../src/common/reader'
import './__mocks__/mockFileReader'

describe('Tests in Web/Browser environment', () => {
  const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))

  test.concurrent('should convert Blob to string', async () => {
    const blob = new Blob([file.toString()], { type: 'text/plain' })
    const ofx = new Ofx(await blobToString(blob), {
      formatDate: 'yy',
    }).getTransactionsSummary()
    expect(ofx.dateStart).toBe('18')
  })

  test.concurrent('should convert Blob to string /static method', async () => {
    const blob = new Blob([file.toString()], { type: 'text/plain' })
    const transactions = (await Ofx.fromBlob(blob))
      .config({
        nativeTypes: true,
      })
      .toJson().OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STRTTRN
    const transfer = (transactions || [])[0]
    expect(transfer.TRNAMT).toBe(74.4)
  })

  test.concurrent('Should throw error with invalid blob', async () => {
    jest.mock('../src/common/reader', () => ({
      window: null,
    }))
    expect(async () =>
      new Reader().fromBlob('invalid' as unknown as Blob),
    ).rejects.toThrow('Invalid blob')
  })
})
