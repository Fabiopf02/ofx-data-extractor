import { BankTransactionList } from './banking'
import { Balance, Status } from './common'

export type CreditCardTransactionResponse = {
  TRNUID: string
  STATUS: Status
  CCSTMTRS: CreditCardStatementResponse
  [key: string]: any
}

export type CreditCardStatementResponse = {
  CURDEF: string
  CCACCTFROM: CreditCardAccount
  BANKTRANLIST: BankTransactionList
  LEDGERBAL: Balance
  AVAILBAL?: Balance
  [key: string]: any
}

export type CreditCardAccount = {
  ACCTID: string
  [key: string]: any
}

export type CreditCardResponse = {
  CCSTMTTRNRS: CreditCardTransactionResponse
  [key: string]: any
}
