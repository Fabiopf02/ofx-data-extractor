import {
  ExtractorConfig,
  MetaData,
  TransactionsSummary,
} from 'src/@types/common'

// TODO: leave return typing for extractor implementation

export interface IExtractor<T> {
  config(config: ExtractorConfig): this

  getHeaders(): MetaData

  getBankTransferList(): any

  getTransactionsSummary(): TransactionsSummary

  getContent(): any

  toJson(): T
}
