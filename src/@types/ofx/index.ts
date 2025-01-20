import { MetaData } from '../common'
import { BankResponse } from './banking'
import { CreditCardResponse } from './credit-card'
import { SignOnResponse } from './signon'

export type OFX = {
  SIGNONMSGSRSV1: SignOnResponse
  BANKMSGSRSV1: BankResponse
  CREDITCARDMSGSRSV1: CreditCardResponse
}

export type OfxStructure = {
  OFX: OFX
}

export type OfxResponse = MetaData & OfxStructure
