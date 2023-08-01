import { Ofx } from '../src/index'
import path from 'path'
import fs from 'fs'
import { fileFromPathToString } from '../src/helpers'

describe('Tests in the Node.js environment', () => {
  test.concurrent('Should read file path', async () => {
    const ofx = await Ofx.fromFilePath(path.resolve(__dirname, 'example.ofx'))
    const headers = ofx.getHeaders()
    expect(headers.OFXHEADER).toBe('100')
    expect(headers.CHARSET).toBe('1252')
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe('102')
  })

  test.concurrent('Should read contents from Buffer', async () => {
    const file = await fileFromPathToString(
      path.resolve(__dirname, 'example.ofx'),
    )
    const ofx = new Ofx(file)
    const headers = ofx.getHeaders()
    expect(headers.OFXHEADER).toBe('100')
    expect(headers.CHARSET).toBe('1252')
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe('102')
  })

  test.concurrent('Should throw error for invalid file path', async () => {
    expect(() =>
      fileFromPathToString(path.resolve(__dirname, 'exampl.ofx')),
    ).rejects.toMatchObject({
      code: 'ENOENT',
      syscall: 'open',
    })
  })
})
