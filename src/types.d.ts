export type OFXMetaData = {
  OFXHEADER: string
  DATA: string
  VERSION: string
  SECURITY: string
  ENCODING: string
  CHARSET: string
  COMPRESSION: string
  OLDFILEUID: string
  NEWFILEUID: string
}

export type DateResponse = {
  datetime: string | null
  date: string | null
  time: string | null
  offset: string | null
  timezone: string | null
}

/**
 * separated - returns the separate transaction id: 
 *  `{
 *    "date": string,
      "transactionCode": string,
      "protocol": string
    }`
 */
type ConfigFitId = 'normal' | 'separated'

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
  formatDate?: FormatDate
}

type MapKeys<T> = {
  [Property in keyof T]?: string
}

type KeysJson = MapKeys<
  | Status
  | BankAccountFrom
  | STRTTRN
  | BankTransferList
  | LedGerBal
  | FINANCIAL_INSTITUTION
  | OfxStructure
>

export type OfxConfig = ConfigDate & {
  fitId?: ConfigFitId
  nativeTypes?: boolean
  formatJson?: MapKeys<KeysJson>
}

type Status = {
  CODE: string
  SEVERITY: string
}

type BankAccountFrom = {
  BANKID: string
  ACCTID: string
  ACCTT: string
}

type TransferType = string

type STRTTRN = {
  TRNTYPE: TransferType
  DTPOSTED: DateResponse
  TRNAMT: string
  FITID: string
  CHECKNUM: string
  MEMO: string
}

export type BankTransferList = {
  DTSTART: DateResponse
  DTEND: DateResponse
  STRTTRN: STRTTRN[]
}

type LedGerBal = {
  BALAMT: string
  DTASOF: DateResponse
}

type FINANCIAL_INSTITUTION = {
  ORG: string
  FID: string
}

export type OfxStructure = {
  OFX: {
    SIGNONMSGSRSV1: {
      SONRS: {
        STATUS: Status
        DTSERVER: DateResponse
        LANGUAGE: string
        DTACCTUP: DateResponse
        FI: FINANCIAL_INSTITUTION
      }
    }
    BANKMSGSRSV1: {
      STMTTRNRS: {
        TRNUID: number
        STATUS: Status
        STMTRS: {
          CURDEF: string
          BANKACCTFROM: BankAccountFrom
          BANKTRANLIST: BankTransferList
          LEDGERBAL: LedGerBal
          MKTGINFO: string
        }
      }
    }
  }
}

export type OfxResponse = OFXMetaData & OfxStructure
