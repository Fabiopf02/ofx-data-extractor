import { isValidNumberToConvert } from './parse'
import { formatDate } from './date'
import {
  extractFinancialInstitutionTransactionId,
  isDateField,
  sanitizeCurrency,
} from './parse'
import { ExtractorConfig } from '../@types/common'
import { ELEMENT_CLOSURE_REGEX, ELEMENT_OPENING_REGEX } from './constants'
import { objectStartReplacer, objectEndReplacer, trim } from './parse'

export class Config {
  private internConfig = {} as ExtractorConfig

  constructor(private readonly config: ExtractorConfig) {
    this.internConfig = config
  }

  getConfig() {
    return this.internConfig
  }

  private configDate(dateString: string) {
    const { formatDate: format } = this.internConfig
    if (format) return formatDate(dateString, format)
    return formatDate(dateString, 'y-M-d')
  }

  private configFinancialInstitutionTransactionId(fitString: string) {
    const { fitId } = this.internConfig
    if (fitId === 'separated')
      return extractFinancialInstitutionTransactionId(fitString)
    return `"${fitString}",`
  }

  private sanitizeValue(field: string, value: string) {
    let fieldValue = value.replace(/[{]/g, '').replace(/(},)/g, '')
    if (field.endsWith('AMT')) fieldValue = sanitizeCurrency(fieldValue)
    if (isDateField(field)) fieldValue = this.configDate(fieldValue)
    if (field === 'FITID')
      return this.configFinancialInstitutionTransactionId(fieldValue)
    if (
      this.internConfig.nativeTypes &&
      isValidNumberToConvert(field, fieldValue)
    ) {
      return `${fieldValue},`
    }
    return `"${fieldValue}",`
  }

  sanitize(line: string) {
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
    return sanitizedLine.replace(field + ':', `"${field}":`)
  }

  getPartialJsonData(data: string) {
    const [_, ofxContentText] = data.split('<OFX>')
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
}
