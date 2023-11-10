import { OfxResponse, OfxStructure, STRTTRN } from '../@types/ofx'
import {
  ExtractorConfig,
  MetaData,
  TransactionsSummary,
} from 'src/@types/common'

export interface IExtractor<T> {
  config(config: ExtractorConfig): this

  getHeaders(): MetaData

  getBankTransferList(): STRTTRN[]

  getCreditCardTransferList(): STRTTRN[]

  getTransactionsSummary(): TransactionsSummary

  getContent(): OfxStructure

  toJson(): OfxResponse
}
