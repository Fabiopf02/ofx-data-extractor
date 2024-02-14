import { blobToString, bufferToString } from '../common/reader'

export class Reader {
  private dataRead: string = ''

  constructor(private readonly data?: string) {
    if (data) this.dataRead = data
  }

  getData(): string {
    return this.dataRead
  }

  public fromString(data: string) {
    return new Reader(data)
  }

  public fromBuffer(data: Buffer) {
    return new Reader(bufferToString(data))
  }

  public async fromBlob(blob: Blob): Promise<Reader> {
    return new Reader(await blobToString(blob))
  }

  public static fromString(data: string) {
    return new Reader(data)
  }

  public static fromBuffer(data: Buffer) {
    return new Reader(bufferToString(data))
  }

  public static async fromBlob(blob: Blob): Promise<Reader> {
    return new Reader(await blobToString(blob))
  }
}
