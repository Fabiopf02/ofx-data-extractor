import { Ofx } from '../src/index'

describe('Tests for Web/Browser environment with feature not available ', () => {
  test.concurrent('Should throw error for FileReader undefined', () => {
    jest.mock('../src/common/reader', () => ({
      window: null,
    }))
    expect(
      async () => await Ofx.fromBlob('invalid' as unknown as Blob),
    ).rejects.toThrow('FileReader is not available in this environment.')
  })
})
