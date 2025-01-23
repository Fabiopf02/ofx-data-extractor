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

export type ExtractorConfig = ConfigDate & {
  fitId?: ConfigFitId
  nativeTypes?: boolean
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
