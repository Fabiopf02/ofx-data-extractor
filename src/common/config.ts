import { getConfiguredDate, isValidNumberToConvert, sanitize } from './parse'
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

  sanitize(row: string) {
    return sanitize(row, this.internConfig)
  }

  getPartialJsonData(data: string) {
    const [_, ofxContentText] = data.split('<OFX>')
    const ofxContent = '<OFX>' + ofxContentText
    const { sanitize } = this
    /**
     * Use replace first for closing tag so there is no conflict in `objectStartReplacer`
     */
    return ofxContent
      .replace(ELEMENT_CLOSURE_REGEX, value => objectEndReplacer(value))
      .replace(ELEMENT_OPENING_REGEX, value => objectStartReplacer(value))
      .split('\n')
      .map(trim)
      .filter(Boolean)
      .map(sanitize, this)
      .join('')
  }
}
