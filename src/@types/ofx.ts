import type { ConfigDate, ConfigFitId, DateResponse, MetaData } from './common'

export type Status = {
  CODE: string
  SEVERITY: string
}

export type BankAccountFrom = {
  BANKID: string
  ACCTID: string
  ACCTT: string
}

type TransferType = string

export type OfxConfig = ConfigDate & {
  fitId?: ConfigFitId
  nativeTypes?: boolean
  // formatJson?: MapKeys<KeysJson>
}

export type STRTTRN = {
  TRNTYPE: TransferType
  DTPOSTED: DateResponse
  TRNAMT: string
  FITID: string | { date: string; protocol: string; transactionCode: string }
  CHECKNUM: string
  MEMO: string
}

export type BankTransferList = {
  DTSTART: DateResponse
  DTEND: DateResponse
  STRTTRN: STRTTRN[]
}

export type LedGerBal = {
  BALAMT: string
  DTASOF: DateResponse
}

export type FINANCIAL_INSTITUTION = {
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

export type OfxResponse = MetaData & OfxStructure
