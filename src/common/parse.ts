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
  QUOTE_PATTERN,
  QUOTE_PATTERN_REGEX,
  START_STATEMENT_TRANSACION,
} from './constants'
import { ExtractorConfig } from '../@types/common'
import { formatDate } from './date'
import { isDebt } from './helpers'
import type { StatementTransaction } from '../@types/ofx/common'

export function fixJsonProblems(content: string) {
  const result = content
    .replace(/(\\)/g, '\\\\')
    .replace(ELEMENT_CLOSURE_REGEX, value => objectEndReplacer(value, true))
    .replace(ELEMENT_OPENING_REGEX, value => objectStartReplacer(value, true))
    .replace(/(},})/g, '}}')
    .replace(/(}")/g, '},"')
    .replace(/(]")/g, '],"')
    .replace(/(},])/g, '}]')
    .replace(/(,})/g, '}')
    .replace(/,\s*}/g, '}')
    .replace(/(,",)/, '",')
    .replace(QUOTE_PATTERN_REGEX, '\\"')
    .slice(0, -1)
  if (result.endsWith(',')) return result.slice(0, -1)
  return result
}

export const extractFinancialInstitutionTransactionId = (fitid: string) =>
  JSON.stringify({
    date: fitid.slice(0, 12),
    transactionCode: fitid.slice(12, 19),
    protocol: fitid.slice(19),
  })

export const isDateField = (field: string) => field.startsWith('DT')

export const trim = (str: string) => str.trim()

export function objectStartReplacer(param: string, force = false) {
  if (OPENING_TAGS_INITIALLY_IGNORED.includes(param) && !force) return param
  return param.replace(/[<]/g, '\n"').replace(/[>]/g, '":{')
}

export function objectEndReplacer(param: string, force = false) {
  if (CLOSING_TAGS_INITIALLY_IGNORED.includes(param) && !force)
    return `\n${param}`
  return '},\n'
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
  if (value.search(',') > value.search('.'))
    return value.replace(/[.]/g, '').replace(/[,]/g, '.')
  return value.replace(/[,]/g, '')
}

type GetDateParams = Pick<ExtractorConfig, 'formatDate'> & {
  dateString: string
}
export function getConfiguredDate({
  dateString,
  formatDate: format = 'y-M-d',
}: GetDateParams) {
  return formatDate(dateString, format)
}

type SanitizeValueParams = ExtractorConfig & {
  field: string
  value: string
}
function sanitizeValue(params: SanitizeValueParams) {
  let fieldValue = params.value
    .replace(/[{]/g, '')
    .replace(/(},)/g, '')
    .replace(/["]/g, QUOTE_PATTERN)
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
  // braces around the values
  if (row.match(/{(\w|\W)+/)) {
    sanitizedLine = sanitizedLine.replace(/({(\w|\W)+)$/, (value: string) =>
      sanitizeValue({
        field: sanitizedLine.slice(0, sanitizedLine.indexOf(':')),
        value,
        ...config,
      }),
    )
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
  const hasBankTransferTag = ofxContent.indexOf(BANK_SERVICE_START) > 0
  if (!hasBankTransferTag)
    return {
      newBankStatementTransactions: null,
      oldBankStatementTransactions: null,
    }
  const transactions = parseTransactions(
    ofxContent.substring(
      ofxContent.indexOf(BANK_SERVICE_START),
      ofxContent.indexOf(BANK_SERVICE_END) + BANK_SERVICE_END.length,
    ),
  )
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

export function extractMetaDataFromXml(data: string[]) {
  const result: string[] = []
  for (const tag of data) {
    result.push(
      ...tag
        .replace('<?xml', ' ')
        .replace('<?OFX', ' ')
        .replace('?>', ' ')
        .split(' ')
        .filter(Boolean)
        .map(trim)
        .map(line => line.replace('=', ':').replace(/["]/g, '')),
    )
  }
  return result
}

export function convertMetaDataToObject(
  stringList: string[],
  nativeTypes: boolean,
) {
  const result: { [key: string]: any } = {}
  if (stringList.join('').search('<?') > -1) {
    stringList = extractMetaDataFromXml(stringList)
  }
  for (const line of stringList) {
    const [key, value] = line.split(':')
    const sanitizedKey = key.replace('\n', '').toUpperCase()
    result[sanitizedKey] =
      nativeTypes && isValidNumberToConvert(key, value)
        ? Number(value)
        : String(value).replace(/\?>/, '')
  }
  return result
}

export function getTransactionsSummary(transations: StatementTransaction[]) {
  return transations.reduce(
    (prevValue, currValue) => {
      const value = Math.abs(+currValue.TRNAMT)
      if (isDebt(currValue)) {
        prevValue.amountOfDebits++
        prevValue.debit += value
        return prevValue
      }
      prevValue.amountOfCredits++
      prevValue.credit += value
      return prevValue
    },
    { credit: 0, debit: 0, amountOfCredits: 0, amountOfDebits: 0 },
  )
}
