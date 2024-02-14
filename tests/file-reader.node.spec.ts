import { readFileSync } from 'fs'
import { Ofx } from '../src/index'
import path from 'path'

describe('Tests in the Node.js environment', () => {
  test.concurrent('Should read file path', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example.ofx'))
    const ofx = Ofx.fromBuffer(file)
    const headers = ofx.getHeaders()
    expect(headers.OFXHEADER).toBe('100')
    expect(headers.CHARSET).toBe('1252')
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe('102')
  })

  test.concurrent('Should read contents from Buffer', async () => {
    const file = readFileSync(path.resolve(__dirname, 'example.ofx'))
    const ofx = new Ofx(file.toString())
    const headers = ofx.getHeaders()
    expect(headers.OFXHEADER).toBe('100')
    expect(headers.CHARSET).toBe('1252')
    expect(headers.ENCODING).toBe('UTF-8')
    expect(headers.VERSION).toBe('102')
  })
})
