import { ELEMENT_CLOSURE_REGEX, ELEMENT_OPENING_REGEX } from './config'
import {
  convertMetaDataToObject,
  extractFinancialInstitutionTransactionId,
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
  BankTransferList,
  OfxConfig,
  OFXMetaData,
  OfxResponse,
  OfxStructure,
} from './types'

export class Ofx {
  private data: string
  private config: OfxConfig = {}

  constructor(data: string | Buffer, config?: OfxConfig) {
    if (config) this.config = config
    if (data instanceof Buffer) this.data = data.toString()
    else this.data = data
  }

  getHeaders(): OFXMetaData {
    const [metaDataString] = this.data.split('<OFX>')
    const metaDataList = metaDataString.split('\n')
    const validate = (line: string) => !!line.trim().length
    const validatedMetaDataList = metaDataList.filter(validate)
    return convertMetaDataToObject(
      validatedMetaDataList,
      !!this.config.nativeTypes,
    ) as OFXMetaData
  }

  getBankTransferList(): Pick<BankTransferList, 'STRTTRN'> {
    const { newListText } = getBankTransferListText(this.getPartialJsonData())

    const list = newListText.slice(10)
    const fixedList = fixJsonProblems(list)
    return JSON.parse(fixedList)
  }

  private getPartialJsonData() {
    const [_, ofxContentText] = this.data.split('<OFX>')
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
      this.config.nativeTypes &&
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
    const { fitId } = this.config
    if (fitId === 'separated')
      return extractFinancialInstitutionTransactionId(fitString)
    return `"${fitString}",`
  }

  private configDate(dateString: string) {
    const { formatDate: format } = this.config
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
