import type {
  ExtractorConfig,
  MetaData,
  NormalizeOptions,
  NormalizedOfxData,
  OfxDiagnostic,
  TransactionsSummary,
  ValidationReport,
} from '../@types/common'
import { IExtractor } from '../interfaces/extractor.interface'
import { applyConfiguredDates, convertMetaDataToObject } from '../common/parse'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { Reader } from './reader'
import { OfxExtractor } from './ofx-extractor'
import { OfxResponse, OfxStructure } from '../@types/ofx/index'
import { extractType } from '../common/helpers'
import { StatementTransaction } from '../@types/ofx/common'
import { normalizeOfxData, validateOfxData } from '../common/analysis'

export class Extractor<T = any> implements IExtractor<T> {
  private customExtractorInstance: CustomExtractor
  private dataReaderInstance: Reader = new Reader('')
  private diagnostics: OfxDiagnostic[] = []

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

  getType() {
    return extractType(this.dataReaderInstance.getData())
  }

  private beginOperation() {
    this.diagnostics = []
  }

  private getParserMode() {
    return this.customExtractorInstance.configInstance.getConfig().parserMode
  }

  private pushWarning(warning: OfxDiagnostic) {
    this.diagnostics.push(warning)
  }

  private safelyExecute<U>(
    operationName: string,
    fallback: U,
    callback: () => U,
  ): U {
    try {
      return callback()
    } catch (error) {
      if (this.getParserMode() !== 'lenient') throw error
      this.pushWarning({
        code: 'PARSE_ERROR',
        message: `Failed to parse OFX while running '${operationName}'.`,
        severity: 'warning',
        context: error instanceof Error ? error.message : String(error),
        path: operationName,
      })
      return fallback
    }
  }

  private getHeadersInternal(): MetaData {
    return this.safelyExecute('getHeaders', {} as MetaData, () => {
      const [metaDataString] = this.dataReaderInstance.getData().split('<OFX>')
      return convertMetaDataToObject(
        String(metaDataString)
          .split('\n')
          .filter(line => !!line.trim().length),
        !!this.customExtractorInstance.configInstance.getConfig().nativeTypes,
      ) as MetaData
    })
  }

  private getContentInternal(): OfxStructure {
    return this.safelyExecute('getContent', { OFX: {} } as OfxStructure, () => {
      return this.customExtractorInstance.getContent(
        this.dataReaderInstance.getData(),
      ) as OfxStructure
    })
  }

  private getResponseInternal(): OfxResponse {
    const ofxMetaDataResult = this.getHeadersInternal()
    const ofxContentResult = this.getContentInternal()
    return { ...ofxMetaDataResult, ...ofxContentResult } as OfxResponse
  }

  getHeaders(): MetaData {
    this.beginOperation()
    return this.getHeadersInternal()
  }

  getBankTransferList(): StatementTransaction[] {
    this.beginOperation()
    return this.safelyExecute('getBankTransferList', [], () => {
      return this.customExtractorInstance.getBankTransferList(
        this.dataReaderInstance.getData(),
      )
    })
  }

  getCreditCardTransferList(): StatementTransaction[] {
    this.beginOperation()
    return this.safelyExecute('getCreditCardTransferList', [], () => {
      return this.customExtractorInstance.getCreditCardTransferList(
        this.dataReaderInstance.getData(),
      )
    })
  }

  getTransactionsSummary(): TransactionsSummary {
    this.beginOperation()
    return this.safelyExecute(
      'getTransactionsSummary',
      {
        credit: 0,
        debit: 0,
        amountOfCredits: 0,
        amountOfDebits: 0,
        dateStart: '',
        dateEnd: '',
      },
      () => {
        return this.customExtractorInstance.getTransactionsSummary(
          this.dataReaderInstance.getData(),
        )
      },
    )
  }

  getContent(): OfxStructure {
    this.beginOperation()
    return this.getContentInternal()
  }

  toJson() {
    this.beginOperation()
    return this.getResponseInternal()
  }

  /**
   * Runs the extraction with `DT*` fields untouched (no `formatDate`), so
   * date-aware consumers see the full OFX value (including hh:mm:ss).
   */
  private getResponseWithRawDates(): OfxResponse {
    const configInstance = this.customExtractorInstance.configInstance
    this.customExtractorInstance.setConfig(configInstance.withRawDates())
    try {
      return this.getResponseInternal()
    } finally {
      this.customExtractorInstance.setConfig(configInstance)
    }
  }

  toNormalized(options: NormalizeOptions = {}): NormalizedOfxData {
    this.beginOperation()
    const configuredFormat =
      this.customExtractorInstance.configInstance.getConfig().formatDate
    const normalized = normalizeOfxData(this.getResponseWithRawDates(), {
      ...options,
      formatDate: options.formatDate || configuredFormat,
    })
    // `raw` keeps exposing the transaction as toJson() does (configured format).
    normalized.transactions.forEach(transaction =>
      applyConfiguredDates(transaction.raw, configuredFormat),
    )
    return normalized
  }

  validate(): ValidationReport {
    this.beginOperation()
    return validateOfxData(this.getResponseWithRawDates())
  }

  getWarnings(): OfxDiagnostic[] {
    return [...this.diagnostics]
  }
}
