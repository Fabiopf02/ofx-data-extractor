import {
  blobToString,
  bufferToString,
  fileFromPathToString,
} from '../common/reader'

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

  public async fromFilePath(pathname: string): Promise<Reader> {
    const data = await fileFromPathToString(pathname)
    return new Reader(data)
  }

  public async fromBlob(blob: Blob): Promise<Reader> {
    const data = await blobToString(blob)
    return new Reader(data)
  }

  public static fromString(data: string) {
    return new Reader(data)
  }

  public static fromBuffer(data: Buffer) {
    return new Reader(bufferToString(data))
  }

  public static async fromFilePath(pathname: string): Promise<Reader> {
    const data = await fileFromPathToString(pathname)
    return new Reader(data)
  }

  public static async fromBlob(blob: Blob): Promise<Reader> {
    const data = await blobToString(blob)
    return new Reader(data)
  }
}
