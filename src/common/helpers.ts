import { STRTTRN } from '../@types/ofx'
import { Types } from '../@types/common'
import { BANK_SERVICE_START } from './constants'

export const extractType = (content: string) => {
  if (content.includes(BANK_SERVICE_START)) {
    return Types.BANK
  }
  return Types.CREDIT_CARD
}

export function isDebt(strttrn: STRTTRN) {
  const type = String(strttrn.TRNTYPE).toLocaleLowerCase()
  return type === '1' || type.startsWith('deb')
}
