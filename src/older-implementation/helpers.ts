import { END_TEXT_BANK_TRANSFER, START_TEXT_BANK_TRANSFER } from './config'
import { STRTTRN as STRTTRNType } from './types'

function separatePartsOfDate(date: string) {
  const year = date.slice(0, 4)
  const month = date.slice(4, 6)
  const day = date.slice(6, 8)
  const hour = date.slice(8, 10)
  const minutes = date.slice(10, 12)
  const seconds = date.slice(12, 14)
  const [offset, timezone] = date
    .slice(14)
    .replace('[', '')
    .replace(']', '')
    .split(':')
  return {
    yyyy: year,
    yy: year.slice(2),
    y: year,
    MM: month,
    M: month,
    dd: day,
    d: day,
    hh: hour,
    h: hour,
    mm: minutes,
    m: minutes,
    ss: seconds,
    s: seconds,
    O: offset,
    TZ: timezone,
  }
}

export function formatDate(date: string, format: string) {
  const parts = separatePartsOfDate(date)
  let result = format
  for (const [key, value] of Object.entries(parts)) {
    result = result.replace(key, value)
  }
  return result
}

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

export function bufferToString(data: Buffer) {
  return data.toString()
}

export async function fileFromPathToString(pathname: string) {
  const fileData: string = await new Promise((resolve, reject) => {
    import('fs').then(fs => {
      return fs.readFile(pathname, (err, data) => {
        if (err) reject(err)
        else resolve(data.toString())
      })
    })
  })
  return fileData
}

export async function blobToString(blob: Blob): Promise<string> {
  const data: string = await new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.FileReader) {
      const reader = new window.FileReader()
      reader.onload = event => resolve(event.target!.result as string)
      reader.onerror = event => reject(event.target!.error)
      reader.readAsText(blob)
    } else {
      reject(new Error('FileReader is not available in this environment.'))
    }
  })
  return data
}
