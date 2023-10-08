import type { ExtractorConfig, MetaData } from '../@types/common'
import { IExtractor } from '../interfaces/extractor.interface'
import { convertMetaDataToObject } from '../common/parse'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { Reader } from './reader'

export class Extractor<T = any> extends Reader implements IExtractor<T> {
  private __customExtractor: CustomExtractor

  constructor(private readonly customExtractor: CustomExtractor) {
    super()
    this.__customExtractor = customExtractor
    this.config({})
  }

  config(config: ExtractorConfig): this {
    const configInstance = new Config(config)
    this.__customExtractor.setConfig(configInstance)
    return this
  }

  getHeaders(): MetaData {
    const [metaDataString] = this.getData().split('<OFX>')
    const metaDataList = metaDataString.split('\n')
    const validate = (line: string) => !!line.trim().length
    const validatedMetaDataList = metaDataList.filter(validate)
    return convertMetaDataToObject(
      validatedMetaDataList,
      !!this.__customExtractor.configInstance.getConfig().nativeTypes,
    ) as MetaData
  }

  getBankTransferList() {
    return this.__customExtractor.getBankTransferList(this.getData())
  }

  getTransactionsSummary() {
    return this.__customExtractor.getTransactionsSummary(this.getData())
  }

  getContent() {
    return this.__customExtractor.getContent(this.getData())
  }

  toJson(): T {
    const ofxMetaDataResult = this.getHeaders()
    const ofxContentResult = this.__customExtractor.getContent(this.getData())
    return { ...ofxMetaDataResult, ...ofxContentResult } as T
  }
}
