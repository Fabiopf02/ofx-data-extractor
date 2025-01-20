export interface Status {
  CODE: number | string
  SEVERITY: 'INFO' | 'WARN' | 'ERROR'
  MESSAGE?: string
}

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CREDITLINE' | 'MONEYMRKT'

export type BankAccount = {
  BANKID: string
  ACCTID: string
  ACCTTYPE: AccountType
}

export type TransactionType =
  | 'CREDIT'
  | 'DEBIT'
  | 'INT'
  | 'DIV'
  | 'FEE'
  | 'SRVCHG'
  | 'DEP'
  | 'ATM'
  | 'POS'
  | 'XFER'
  | 'CHECK'
  | 'PAYMENT'
  | 'CASH'
  | 'DIRECTDEP'
  | 'DIRECTDEBIT'
  | 'REPEATPMT'
  | 'OTHER'

export interface Balance {
  BALAMT: number
  DTASOF: string
}

export type StatementTransaction = {
  TRNTYPE: TransactionType
  DTPOSTED: string
  DTAVAIL?: string
  TRNAMT: number
  FITID: string
  CHECKNUM?: string
  MEMO?: string
}
