import { Config } from '../common/config'
import {
  blobToString,
  bufferToString,
  convertMetaDataToObject,
  extractFinancialInstitutionTransactionId,
  fileFromPathToString,
  fixJsonProblems,
  formatDate,
  getBankTransferListText,
  getTransactionsSummary,
  isDateField,
  isValidNumberToConvert,
  objectEndReplacer,
  objectStartReplacer,
  sanitizeCurrency,
  trim,
} from './helpers'
import {
  OfxConfig,
  OFXMetaData,
  OfxResponse,
  OfxStructure,
  STRTTRN,
} from './types'

export class Ofx {
  private _data: string
  private _config: Config

  constructor(data: string, config?: OfxConfig) {
    this._config = new Config(config || {})
    this._data = data
  }

  static fromBuffer(data: Buffer) {
    return new Ofx(bufferToString(data))
  }

  static async fromFilePath(pathname: string) {
    const data = await fileFromPathToString(pathname)
    return new Ofx(data)
  }

  static async fromBlob(blob: Blob): Promise<Ofx> {
    const data = await blobToString(blob)
    return new Ofx(data)
  }

  config(config: OfxConfig) {
    this._config = new Config(config)
    return this
  }

  getHeaders(): OFXMetaData {
    const [metaDataString] = this._data.split('<OFX>')
    const metaDataList = metaDataString.split('\n')
    const validate = (line: string) => !!line.trim().length
    const validatedMetaDataList = metaDataList.filter(validate)
    return convertMetaDataToObject(
      validatedMetaDataList,
      !!this._config.getConfig().nativeTypes,
    ) as OFXMetaData
  }

  getBankTransferList(): STRTTRN[] {
    const { newListText } = getBankTransferListText(
      this._config.getPartialJsonData(this._data),
    )
    const list = newListText.slice(10)
    const fixedList = fixJsonProblems(list)
    return JSON.parse(fixedList)
  }

  getTransactionsSummary() {
    const jsonData = this.getContent()
    const {
      DTEND,
      DTSTART,
      STRTTRN: transactions,
    } = jsonData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST
    const summary = getTransactionsSummary(transactions)
    return {
      dateStart: DTSTART,
      dateEnd: DTEND,
      ...summary,
    }
  }

  getContent(): OfxStructure {
    const ofxText = this._config.getPartialJsonData(this._data)
    const { newListText, oldListText } = getBankTransferListText(ofxText)
    const result = ofxText.replace(oldListText, newListText)
    return JSON.parse(`{${fixJsonProblems(result)}}`)
  }

  toJson(): OfxResponse {
    const ofxMetaDataResult = this.getHeaders()
    const ofxContentResult = this.getContent()
    const result = { ...ofxMetaDataResult, ...ofxContentResult }
    return result
  }
}
