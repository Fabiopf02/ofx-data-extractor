import { sanitize } from './parse'
import { ExtractorConfig } from '../@types/common'
import {
  ELEMENT_CLOSURE_REGEX,
  ELEMENT_OPENING_REGEX,
  SGML_LEAF_FOLLOWED_BY_CLOSURE_REGEX,
} from './constants'
import {
  objectStartReplacer,
  objectEndReplacer,
  protectTextNodes,
  trim,
} from './parse'

export class Config {
  private internConfig = {} as ExtractorConfig
  private readonly sanitizeConfig: ExtractorConfig & { rawDates?: boolean }

  /**
   * @param rawDates internal: keep `DT*` values exactly as they appear in the
   * OFX instead of applying `formatDate` (used by `toNormalized`).
   */
  constructor(
    private readonly config: ExtractorConfig,
    private readonly rawDates = false,
  ) {
    this.internConfig = config
    this.sanitizeConfig = { ...config, rawDates }
  }

  getConfig() {
    return this.internConfig
  }

  withRawDates() {
    return new Config(this.config, true)
  }

  sanitizeRow(row: string) {
    return sanitize(row, this.sanitizeConfig)
  }

  getPartialJsonData(data: string) {
    const [_, ofxContentText] = data.split('<OFX>')
    const ofxContent = protectTextNodes('<OFX>' + ofxContentText)
    const { sanitizeRow } = this
    /**
     * Use replace first for closing tag so there is no conflict in `objectStartReplacer`
     */
    return ofxContent
      /**
       * SGML leaf followed by a container closing tag on the same line
       * (`<SEVERITY>INFO</STATUS>`): move the closing tag to its own line.
       * XML leaves (`<CODE>0</CODE>`) have matching names and are untouched.
       */
      .replace(
        SGML_LEAF_FOLLOWED_BY_CLOSURE_REGEX,
        (match, open: string, value: string, close: string) =>
          open === close ? match : `<${open}>${value}\n</${close}>`,
      )
      .replace(/<(?=[^\/])/g, '\n<')
      .replace(ELEMENT_CLOSURE_REGEX, value => objectEndReplacer(value))
      .replace(ELEMENT_OPENING_REGEX, value => objectStartReplacer(value))
      .split('\n')
      .map(trim)
      .filter(Boolean)
      .map(sanitizeRow, this)
      .join('')
  }
}
