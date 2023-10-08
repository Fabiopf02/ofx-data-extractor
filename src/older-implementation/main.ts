import { Extractor } from '../implementations/extractor'
import { MetaData } from '../@types/common'
import { OfxResponse, OfxStructure, STRTTRN, OfxConfig } from '../@types/ofx'
import { OfxExtractor } from '../implementations/ofx-extractor'
import { Reader } from '../implementations/reader'

export class Ofx {
  private extractor: Extractor

  constructor(data: string, config?: OfxConfig) {
    console.warn('This class may be removed due to the new implementation')
    this.extractor = new Extractor(new OfxExtractor())
    this.extractor.data(new Reader(data))
    this.extractor.config(config || {})
  }

  static fromBuffer(data: Buffer) {
    return new Ofx(Reader.fromBuffer(data).getData())
  }

  static async fromFilePath(pathname: string) {
    const reader = await Reader.fromFilePath(pathname)
    return new Ofx(reader.getData())
  }

  static async fromBlob(blob: Blob): Promise<Ofx> {
    const reader = await Reader.fromBlob(blob)
    return new Ofx(reader.getData())
  }

  config(config: OfxConfig) {
    this.extractor.config(config)
    return this
  }

  getHeaders(): MetaData {
    return this.extractor.getHeaders()
  }

  getBankTransferList(): STRTTRN[] {
    return this.extractor.getBankTransferList()
  }

  getTransactionsSummary() {
    return this.extractor.getTransactionsSummary()
  }

  getContent(): OfxStructure {
    return this.extractor.getContent() as OfxStructure
  }

  toJson(): OfxResponse {
    return this.extractor.toJson()
  }
}
