export type MetaData = {
  OFXHEADER: string
  DATA: string
  VERSION: string
  SECURITY: string
  ENCODING: string
  CHARSET: string
  COMPRESSION: string
  OLDFILEUID: string
  NEWFILEUID: string
  [key: string]: any
}

export type DateResponse = {
  datetime: string | null
  date: string | null
  time: string | null
  offset: string | null
  timezone: string | null
}

export type ConfigDate = {
  /**
   * @description supported keys:
   *  yy => year -> 2 digits,
   *  yyyy or y => year,
   *  MM or M => month,
   *  dd or d => day,
   *  hh or h => hour,
   *  mm or m => minute,
   *  ss or s => second,
   *  O => offset,
   *  TZ => timezone
   * @example format: 'y-M-d h:m:s'
   * @returns '2022-02-21 09:00:00'
   */
  formatDate?: string
}

export type ConfigFitId = 'normal' | 'separated'
export type ParserMode = 'strict' | 'lenient'
export type AmountMode = 'string' | 'number' | 'cents'
export type DateMode = 'raw' | 'formatted' | 'iso' | 'date' | 'timestamp'

export type ExtractorConfig = ConfigDate & {
  fitId?: ConfigFitId
  nativeTypes?: boolean
  parserMode?: ParserMode
}

export type TransactionsSummary = {
  credit: number
  debit: number
  amountOfCredits: number
  amountOfDebits: number
  dateStart: string
  dateEnd: string
}

export enum Types {
  'BANK' = 'BANK',
  'CREDIT_CARD' = 'CREDIT_CARD',
}

export type OfxSeverity = 'warning' | 'error'

export type OfxDiagnostic = {
  code: string
  message: string
  severity: OfxSeverity
  path?: string
  context?: string
}

export type ValidationStats = {
  totalTransactions: number
  bankTransactions: number
  creditCardTransactions: number
  duplicatedFitIds: number
}

export type ValidationReport = {
  isValid: boolean
  warnings: OfxDiagnostic[]
  errors: OfxDiagnostic[]
  stats: ValidationStats
}

export type NormalizeOptions = ConfigDate & {
  amountMode?: AmountMode
  dateMode?: DateMode
}

export type NormalizedDirection = 'credit' | 'debit'

export type NormalizedTransaction = {
  source: 'bank' | 'credit_card'
  direction: NormalizedDirection
  amount: number | string | null
  amountAbs: number | string | null
  postedAt: string | number | Date | null
  description: string
  descriptionNormalized: string
  fitId: string
  currency: string | null
  account: Record<string, any> | null
  institution: Record<string, any> | null
  raw: Record<string, any>
  warnings: OfxDiagnostic[]
}

export type NormalizedOfxData = {
  transactions: NormalizedTransaction[]
  warnings: OfxDiagnostic[]
}
