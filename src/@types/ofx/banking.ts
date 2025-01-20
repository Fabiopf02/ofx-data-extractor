import { AccountType, Balance, StatementTransaction, Status } from './common'

export interface BankResponse {
  STMTTRNRS: StatementTransactionResponse
}

export interface StatementTransactionResponse {
  TRNUID: string
  STATUS: Status
  STMTRS: StatementResponse
}

export interface StatementResponse {
  CURDEF: string
  BANKACCTFROM: BankAccount
  BANKTRANLIST: BankTransactionList
  LEDGERBAL: Balance
  AVAILBAL?: Balance
}

export type BankAccount = {
  BANKID: string
  ACCTID: string
  ACCTTYPE: AccountType
}

export type BankTransactionList = {
  DTSTART: string
  DTEND: string
  STMTTRN: StatementTransaction[]
  STRTTRN: StatementTransaction[]
}
