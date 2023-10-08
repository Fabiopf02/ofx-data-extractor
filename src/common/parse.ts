import { END_TEXT_BANK_TRANSFER, START_TEXT_BANK_TRANSFER } from './constants'
import type { STRTTRN as STRTTRNType } from '../@types/ofx'
import { formatDate } from './date'

export function fixJsonProblems(content: string) {
  const result = content
    .replace(/(},})/g, '}}')
    .replace(/(}")/g, '},"')
    .replace(/(},])/g, '}]')
    .replace(/(,})/g, '}')
    .replace(/({")/g, '{\n"')
    .replace(/(})/g, '\n}')
    .replace(/(",")/g, '",\n"')
    .replace(/,\s*}/g, '\n}')
    .replace(/(,",)/, ',')
  return result.at(-1) === ',' ? result.slice(0, -1) : result
}

export function extractFinancialInstitutionTransactionId(fitid: string) {
  const dateText = fitid.slice(0, 12)
  const transactionCode = fitid.slice(12, 19)
  const protocol = fitid.slice(19)
  const resultObject = {
    date: dateText,
    transactionCode,
    protocol,
  }
  return JSON.stringify(resultObject)
}

export function isDateField(field: string) {
  return field.startsWith('DT')
}

export function trim(str: string) {
  return str.trim()
}

export function objectStartReplacer(param: string) {
  if (param === START_TEXT_BANK_TRANSFER) return param
  return param.replace(/[<]/g, '\n').replace(/[>]/g, ':{')
}

export function objectEndReplacer(param: string) {
  if (param === END_TEXT_BANK_TRANSFER) return `\n${param}`
  return '},'
}

export function sanitizeCurrency(value: string) {
  const comma = value.search(',')
  const point = value.search('.')
  if (comma > point) return value.replace(/[.]/g, '').replace(/[,]/g, '.')
  return value.replace(/[,]/g, '')
}

export function isValidNumberToConvert(field: string, value: string) {
  if (field.endsWith('ID') || field.endsWith('NUM')) return false
  return !isNaN(Number(value))
}

export function getBankTransferListText(ofxContent: string) {
  const startIndex = ofxContent.indexOf(START_TEXT_BANK_TRANSFER)
  const endIndex =
    ofxContent.lastIndexOf(END_TEXT_BANK_TRANSFER) +
    END_TEXT_BANK_TRANSFER.length
  const oldListText = ofxContent.substring(startIndex, endIndex)
  const startRgx = new RegExp(START_TEXT_BANK_TRANSFER, 'g')
  const endRgx = new RegExp(END_TEXT_BANK_TRANSFER, 'g')
  const newListText = `"STRTTRN":[${oldListText
    .replace(startRgx, '{')
    .replace(endRgx, '},')}]`
  return { oldListText, newListText }
}

export function convertMetaDataToObject(
  stringList: string[],
  nativeTypes: boolean,
) {
  const result: { [key: string]: any } = {}
  for (const line of stringList) {
    const [key, value] = line.split(':')
    const sanitizedKey = key.replace('\n', '')
    result[sanitizedKey] =
      nativeTypes && isValidNumberToConvert(key, value) ? Number(value) : value
  }
  return result
}

export function getTransactionsSummary(STRTTRN: STRTTRNType[]) {
  return STRTTRN.reduce(
    (prevValue, currValue) => {
      if (currValue.TRNTYPE.toLocaleLowerCase().startsWith('deb')) {
        prevValue.amountOfDebits++
        prevValue.debit += Number(currValue.TRNAMT.replace('-', ''))
        return prevValue
      }
      prevValue.amountOfCredits++
      prevValue.credit += Number(currValue.TRNAMT)
      return prevValue
    },
    { credit: 0, debit: 0, amountOfCredits: 0, amountOfDebits: 0 },
  )
}
