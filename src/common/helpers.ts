import { Types } from '../@types/common'
import { BANK_SERVICE_START } from './constants'
import type { StatementTransaction } from '../@types/ofx/common'

const debitTypes = [
  'debit',
  'fee',
  'srvchg',
  'atm',
  'pos',
  'check',
  'payment',
  'directdebit',
  'cash',
  'repeatpmt',
]

export const extractType = (content: string) => {
  if (content.includes(BANK_SERVICE_START)) {
    return Types.BANK
  }
  return Types.CREDIT_CARD
}

export function isDebt(transaction: StatementTransaction) {
  if (String(transaction.TRNAMT).startsWith('-')) return true
  const type = String(transaction.TRNTYPE).toLocaleLowerCase()
  return type === '1' || debitTypes.includes(type)
}
