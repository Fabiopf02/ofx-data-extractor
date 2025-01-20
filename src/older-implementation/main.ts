import { Extractor } from '../implementations/extractor'
import { ExtractorConfig, MetaData } from '../@types/common'
import { OfxResponse, OfxStructure } from '../@types/ofx/index'
import { OfxExtractor } from '../implementations/ofx-extractor'
import { Reader } from '../implementations/reader'
import { StatementTransaction } from '../@types/ofx/common'

export class Ofx {
  private extractor: Extractor

  constructor(data: string, config?: ExtractorConfig) {
    this.extractor = new Extractor(new OfxExtractor())
    this.extractor.data(new Reader(data))
    this.extractor.config(config || {})
  }

  getType() {
    return this.extractor.getType()
  }

  static fromBuffer(data: Buffer) {
    return new Ofx(Reader.fromBuffer(data).getData())
  }

  static async fromBlob(blob: Blob): Promise<Ofx> {
    const reader = await Reader.fromBlob(blob)
    return new Ofx(reader.getData())
  }

  config(config: ExtractorConfig) {
    this.extractor.config(config)
    return this
  }

  getHeaders(): MetaData {
    return this.extractor.getHeaders()
  }

  getBankTransferList(): StatementTransaction[] {
    return this.extractor.getBankTransferList()
  }

  getCreditCardTransferList(): StatementTransaction[] {
    return this.extractor.getCreditCardTransferList()
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
