import {
  BANK_SERVICE_END,
  BANK_SERVICE_START,
  CLOSING_TAGS_INITIALLY_IGNORED,
  CREDIT_CARD_SERVICE_END,
  CREDIT_CARD_SERVICE_START,
  ELEMENT_CLOSURE_REGEX,
  ELEMENT_OPENING_REGEX,
  FINISH_STATEMENT_TRANSACTION,
  OPENING_TAGS_INITIALLY_IGNORED,
  START_STATEMENT_TRANSACION,
} from './constants'
import type { STRTTRN as STRTTRNType } from '../@types/ofx'
import { ExtractorConfig } from '../@types/common'
import { formatDate } from './date'

export function fixJsonProblems(content: string) {
  return content
    .replace(/(\\)/g, '\\\\')
    .replace(ELEMENT_CLOSURE_REGEX, value => objectEndReplacer(value, true))
    .replace(ELEMENT_OPENING_REGEX, value => objectStartReplacer(value, true))
    .replace(/(},})/g, '}}')
    .replace(/(}")/g, '},"')
    .replace(/(},])/g, '}]')
    .replace(/(,})/g, '}')
    .replace(/({")/g, '{\n"')
    .replace(/(})/g, '\n}')
    .replace(/(",")/g, '",\n"')
    .replace(/,\s*}/g, '\n}')
    .replace(/(,",)/, ',')
    .slice(0, -1)
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

export function objectStartReplacer(param: string, force = false) {
  if (OPENING_TAGS_INITIALLY_IGNORED.includes(param) && !force) return param
  return param.replace(/[<]/g, '\n"').replace(/[>]/g, '":{')
}

export function objectEndReplacer(param: string, force = false) {
  if (CLOSING_TAGS_INITIALLY_IGNORED.includes(param) && !force)
    return `\n${param}`
  return '},'
}

export function configFinancialInstitutionTransactionId({
  fitId,
  fitValue,
}: Pick<ExtractorConfig, 'fitId'> & { fitValue: string }) {
  if (fitId === 'separated')
    return extractFinancialInstitutionTransactionId(fitValue)
  return `"${fitValue}",`
}

export function sanitizeCurrency(value: string) {
  const comma = value.search(',')
  const point = value.search('.')
  if (comma > point) return value.replace(/[.]/g, '').replace(/[,]/g, '.')
  return value.replace(/[,]/g, '')
}

type GetDateParams = Pick<ExtractorConfig, 'formatDate'> & {
  dateString: string
}
export function getConfiguredDate({
  dateString,
  formatDate: format,
}: GetDateParams) {
  if (format) return formatDate(dateString, format)
  return formatDate(dateString, 'y-M-d')
}

type SanitizeValueParams = ExtractorConfig & {
  field: string
  value: string
}
function sanitizeValue(params: SanitizeValueParams) {
  let fieldValue = params.value.replace(/[{]/g, '').replace(/(},)/g, '')
  const fieldName = params.field.replace(/['"]/g, '')
  if (fieldName.endsWith('AMT')) fieldValue = sanitizeCurrency(fieldValue)
  if (isDateField(fieldName))
    fieldValue = getConfiguredDate({
      dateString: fieldValue,
      formatDate: params.formatDate,
    })
  if (fieldName === 'FITID')
    return configFinancialInstitutionTransactionId({
      fitId: params.fitId,
      fitValue: fieldValue,
    })
  if (params.nativeTypes && isValidNumberToConvert(fieldName, fieldValue)) {
    return `${Number(fieldValue)},`
  }
  return `"${fieldValue}",`
}

export function sanitize(row: string, config: ExtractorConfig) {
  let sanitizedLine = row
  const field = sanitizedLine.slice(0, sanitizedLine.indexOf(':'))
  const replacer = (value: string) => sanitizeValue({ field, value, ...config })

  // braces around the value
  if (row.match(/{(\w|\W)+/)) {
    sanitizedLine = sanitizedLine.replace(/({(\w|\W)+)$/, replacer)
  }
  return sanitizedLine
}

export function isValidNumberToConvert(field: string, value: string) {
  if (field.endsWith('ID') || field.endsWith('NUM')) return false
  return !isNaN(Number(value))
}

export function parseTransactions(content: string) {
  const startIndex = content.indexOf(START_STATEMENT_TRANSACION)
  const endIndex =
    content.lastIndexOf(FINISH_STATEMENT_TRANSACTION) +
    FINISH_STATEMENT_TRANSACTION.length
  const oldListText = content.substring(startIndex, endIndex)
  const startRgx = new RegExp(START_STATEMENT_TRANSACION, 'g')
  const endRgx = new RegExp(FINISH_STATEMENT_TRANSACTION, 'g')
  const newListText = `"STRTTRN":[${oldListText
    .replace(startRgx, '{')
    .replace(endRgx, '},')}]`
  return {
    oldListText: content,
    newListText: content.replace(oldListText, newListText),
  }
}

export function getBankStatementTransactionsText(ofxContent: string) {
  const bankContent = ofxContent.substring(
    ofxContent.indexOf(BANK_SERVICE_START),
    ofxContent.indexOf(BANK_SERVICE_END) + BANK_SERVICE_END.length,
  )
  const transactions = parseTransactions(bankContent)
  return {
    newBankStatementTransactions: transactions.newListText,
    oldBankStatementTransactions: transactions.oldListText,
  }
}

export function getCreditCardStatementTransactionsText(ofxContent: string) {
  const hasCreditCardTag = ofxContent.indexOf(CREDIT_CARD_SERVICE_START) > 0
  if (!hasCreditCardTag)
    return {
      newCreditCardStatementTransactions: null,
      oldCreditCardStatementTransactions: null,
    }
  const bankContent = ofxContent.substring(
    ofxContent.indexOf(CREDIT_CARD_SERVICE_START),
    ofxContent.indexOf(CREDIT_CARD_SERVICE_END) +
      CREDIT_CARD_SERVICE_END.length,
  )
  const transactions = parseTransactions(bankContent)
  return {
    newCreditCardStatementTransactions: transactions.newListText,
    oldCreditCardStatementTransactions: transactions.oldListText,
  }
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
