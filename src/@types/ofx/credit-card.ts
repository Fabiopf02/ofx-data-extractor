import { BankTransactionList } from './banking'
import { Balance, Status } from './common'

export type CreditCardTransactionResponse = {
  TRNUID: string
  STATUS: Status
  CCSTMTRS: CreditCardStatementResponse
}

export type CreditCardStatementResponse = {
  CURDEF: string
  CCACCTFROM: CreditCardAccount
  BANKTRANLIST: BankTransactionList
  LEDGERBAL: Balance
  AVAILBAL?: Balance
}

export type CreditCardAccount = {
  ACCTID: string
}

export type CreditCardResponse = {
  CCSTMTTRNRS: CreditCardTransactionResponse
}
