import type { ExtractorConfig, MetaData } from '../@types/common'
import { IExtractor } from '../interfaces/extractor.interface'
import { convertMetaDataToObject } from '../common/parse'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { Reader } from './reader'

export class Extractor<T = any> implements IExtractor<T> {
  private __customExtractor: CustomExtractor
  private __dataRead: Reader = new Reader('')

  constructor(private readonly customExtractor: CustomExtractor) {
    this.__customExtractor = customExtractor
    this.config({})
  }

  data(readData: Reader) {
    this.__dataRead = readData
    return this
  }

  config(config: ExtractorConfig): this {
    const configInstance = new Config(config)
    this.__customExtractor.setConfig(configInstance)
    return this
  }

  getHeaders(): MetaData {
    const [metaDataString] = this.__dataRead.getData().split('<OFX>')
    const metaDataList = metaDataString.split('\n')
    const validate = (line: string) => !!line.trim().length
    const validatedMetaDataList = metaDataList.filter(validate)
    return convertMetaDataToObject(
      validatedMetaDataList,
      !!this.__customExtractor.configInstance.getConfig().nativeTypes,
    ) as MetaData
  }

  getBankTransferList() {
    return this.__customExtractor.getBankTransferList(this.__dataRead.getData())
  }

  getTransactionsSummary() {
    return this.__customExtractor.getTransactionsSummary(
      this.__dataRead.getData(),
    )
  }

  getContent() {
    return this.__customExtractor.getContent(this.__dataRead.getData())
  }

  toJson(): T {
    const ofxMetaDataResult = this.getHeaders()
    const ofxContentResult = this.__customExtractor.getContent(
      this.__dataRead.getData(),
    )
    return { ...ofxMetaDataResult, ...ofxContentResult } as T
  }
}
