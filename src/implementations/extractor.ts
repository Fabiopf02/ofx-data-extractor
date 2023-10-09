import type { ExtractorConfig, MetaData } from '../@types/common'
import { IExtractor } from '../interfaces/extractor.interface'
import { convertMetaDataToObject } from '../common/parse'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { Reader } from './reader'
import { OfxExtractor } from './ofx-extractor'

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
    const configInstance = new Config(config)
    this.customExtractorInstance.setConfig(configInstance)
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

  getBankTransferList() {
    return this.customExtractorInstance.getBankTransferList(
      this.dataReaderInstance.getData(),
    )
  }

  getTransactionsSummary() {
    return this.customExtractorInstance.getTransactionsSummary(
      this.dataReaderInstance.getData(),
    )
  }

  getContent() {
    return this.customExtractorInstance.getContent(
      this.dataReaderInstance.getData(),
    )
  }

  toJson(): T {
    const ofxMetaDataResult = this.getHeaders()
    const ofxContentResult = this.customExtractorInstance.getContent(
      this.dataReaderInstance.getData(),
    )
    return { ...ofxMetaDataResult, ...ofxContentResult } as T
  }
}
