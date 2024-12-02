import { OfxResponse, OfxStructure, STRTTRN } from '../@types/ofx'
import {
  ExtractorConfig,
  MetaData,
  TransactionsSummary,
  Types,
} from '../@types/common'

export interface IExtractor<T> {
  getType(): Types

  config(config: ExtractorConfig): this

  getHeaders(): MetaData

  getBankTransferList(): STRTTRN[]

  getCreditCardTransferList(): STRTTRN[]

  getTransactionsSummary(): TransactionsSummary

  getContent(): OfxStructure

  toJson(): OfxResponse
}
