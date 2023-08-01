import path from 'path'
import { Ofx } from '../src/index'
import fs from 'fs'

const file = fs.readFileSync(path.resolve(__dirname, 'example.ofx'))

describe('Tests for Web/Browser environment with feature not available ', () => {
  test.concurrent('Should throw error for FileReader undefined', () => {
    const blob = new Blob([file.toString()], { type: 'text/plain' })
    jest.mock('../src/helpers', () => ({
      window: null,
    }))
    expect(
      async () => await Ofx.fromBlob('invalid' as unknown as Blob),
    ).rejects.toThrow('FileReader is not available in this environment.')
  })
})
