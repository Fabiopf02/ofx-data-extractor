import { OfxResponse, OfxStructure } from '../@types/ofx/index'
import {
  ExtractorConfig,
  MetaData,
  TransactionsSummary,
  Types,
} from '../@types/common'
import type { StatementTransaction } from '../@types/ofx/common'

export interface IExtractor<T> {
  getType(): Types

  config(config: ExtractorConfig): this

  getHeaders(): MetaData

  getBankTransferList(): StatementTransaction[]

  getCreditCardTransferList(): StatementTransaction[]

  getTransactionsSummary(): TransactionsSummary

  getContent(): OfxStructure

  toJson(): OfxResponse
}
