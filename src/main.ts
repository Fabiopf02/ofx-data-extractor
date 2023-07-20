import { ELEMENT_CLOSURE_REGEX, ELEMENT_OPENING_REGEX } from './config'
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
  private _config: OfxConfig = {}

  constructor(data: string, config?: OfxConfig) {
    if (config) this._config = config
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
    this._config = config
    return this
  }

  getHeaders(): OFXMetaData {
    const [metaDataString] = this._data.split('<OFX>')
    const metaDataList = metaDataString.split('\n')
    const validate = (line: string) => !!line.trim().length
    const validatedMetaDataList = metaDataList.filter(validate)
    return convertMetaDataToObject(
      validatedMetaDataList,
      !!this._config.nativeTypes,
    ) as OFXMetaData
  }

  getBankTransferList(): STRTTRN[] {
    const { newListText } = getBankTransferListText(this.getPartialJsonData())

    const list = newListText.slice(10)
    const fixedList = fixJsonProblems(list)
    return JSON.parse(fixedList)
  }

  private getPartialJsonData() {
    const [_, ofxContentText] = this._data.split('<OFX>')
    const ofxContent = '<OFX>' + ofxContentText
    const { sanitize } = this
    /**
     * Use replace first for closing tag so there is no conflict in `objectStartReplacer`
     */
    return ofxContent
      .replace(ELEMENT_CLOSURE_REGEX, objectEndReplacer)
      .replace(ELEMENT_OPENING_REGEX, objectStartReplacer)
      .split('\n')
      .map(trim)
      .filter(Boolean)
      .map(sanitize, this)
      .join('')
  }

  private sanitizeValue(field: string, value: string) {
    let fieldValue = value.replace(/[{},]/g, '')
    if (isDateField(field)) {
      fieldValue = this.configDate(fieldValue)
    } else if (field === 'FITID') {
      return this.configFinancialInstitutionTransactionId(fieldValue)
    } else if (
      this._config.nativeTypes &&
      isValidNumberToConvert(field, fieldValue)
    ) {
      return `${fieldValue},`
    }
    return `"${fieldValue}",`
  }

  private sanitize(line: string) {
    let sanitizedLine = line
    const field = sanitizedLine.slice(0, sanitizedLine.indexOf(':'))
    const sanitizeValue = this.sanitizeValue
    const replacer = (matched: string) =>
      sanitizeValue.call(this, field, matched)
    if (line.match(/{(\w|\W)+/)) {
      sanitizedLine = sanitizedLine.replace(/({(\w|\W)+)$/, replacer)
    }
    const matchedProperty = sanitizedLine.search(/(^\w+:)/)
    if (matchedProperty < 0) return sanitizedLine

    return sanitizedLine.replace(field, `"${field}"`)
  }

  private configFinancialInstitutionTransactionId(fitString: string) {
    const { fitId } = this._config
    if (fitId === 'separated')
      return extractFinancialInstitutionTransactionId(fitString)
    return `"${fitString}",`
  }

  private configDate(dateString: string) {
    const { formatDate: format } = this._config
    if (format) return formatDate(dateString, format)
    return formatDate(dateString, 'y-M-d')
  }

  getTransactionsSummary() {
    const jsonData = this.getContent()
    const { DTEND, DTSTART, STRTTRN } =
      jsonData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST
    const summary = getTransactionsSummary(STRTTRN)
    return {
      dateStart: DTSTART,
      dateEnd: DTEND,
      ...summary,
    }
  }

  getContent(): OfxStructure {
    const ofxText = this.getPartialJsonData()
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
