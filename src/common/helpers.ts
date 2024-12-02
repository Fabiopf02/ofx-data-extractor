import { Types } from '../@types/common'
import { BANK_SERVICE_START } from './constants'

export const extractType = (content: string) => {
  if (content.includes(BANK_SERVICE_START)) {
    return Types.BANK
  }
  return Types.CREDIT_CARD
}
