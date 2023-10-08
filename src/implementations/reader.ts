import {
  blobToString,
  bufferToString,
  fileFromPathToString,
} from '../common/reader'

export class Reader {
  private __data: string = ''

  getData(): string {
    return this.__data
  }

  public fromString(data: string): this {
    this.__data = data
    return this
  }

  public fromBuffer(data: Buffer): this {
    this.__data = bufferToString(data)
    return this
  }

  public async fromFilePath(pathname: string): Promise<this> {
    this.__data = await fileFromPathToString(pathname)
    return this
  }

  public async fromBlob(blob: Blob): Promise<this> {
    this.__data = await blobToString(blob)
    return this
  }
}
