import type {
  ExtractorConfig,
  MetaData,
  TransactionsSummary,
} from '../@types/common'
import { IExtractor } from '../interfaces/extractor.interface'
import { convertMetaDataToObject } from '../common/parse'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { Reader } from './reader'
import { OfxExtractor } from './ofx-extractor'
import { OfxResponse, OfxStructure, STRTTRN } from '../@types/ofx'

export class Extractor<T = any> implements IExtractor<T> {
  private customExtractorInstance: CustomExtractor
  private dataReaderInstance: Reader = new Reader('')

  constructor(private readonly customExtractor?: CustomExtractor) {
    this.customExtractorInstance = customExtractor || new OfxExtractor()
    this.config({})
  }

  data(readData: Reader) {
    this.dataReaderInstance = readData
    return this
  }

  config(config: ExtractorConfig): this {
    this.customExtractorInstance.setConfig(new Config(config))
    return this
  }

  getHeaders(): MetaData {
    const [metaDataString] = this.dataReaderInstance.getData().split('<OFX>')
    const metaDataList = metaDataString.split('\n')
    const validate = (line: string) => !!line.trim().length
    const validatedMetaDataList = metaDataList.filter(validate)
    return convertMetaDataToObject(
      validatedMetaDataList,
      !!this.customExtractorInstance.configInstance.getConfig().nativeTypes,
    ) as MetaData
  }

  getBankTransferList(): STRTTRN[] {
    return this.customExtractorInstance.getBankTransferList(
      this.dataReaderInstance.getData(),
    )
  }

  getCreditCardTransferList(): STRTTRN[] {
    return this.customExtractorInstance.getCreditCardTransferList(
      this.dataReaderInstance.getData(),
    )
  }

  getTransactionsSummary(): TransactionsSummary {
    return this.customExtractorInstance.getTransactionsSummary(
      this.dataReaderInstance.getData(),
    )
  }

  getContent(): OfxStructure {
    return this.customExtractorInstance.getContent(
      this.dataReaderInstance.getData(),
    ) as OfxStructure
  }

  toJson() {
    const ofxMetaDataResult = this.getHeaders()
    const ofxContentResult = this.customExtractorInstance.getContent(
      this.dataReaderInstance.getData(),
    )
    return { ...ofxMetaDataResult, ...ofxContentResult } as OfxResponse
  }
}
