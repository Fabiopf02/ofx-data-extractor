import {
  NormalizedOfxData,
  NormalizedTransaction,
  NormalizeOptions,
  OfxDiagnostic,
  ValidationReport,
} from '../@types/common'
import { OfxResponse, OfxStructure } from '../@types/ofx/index'
import { StatementTransaction } from '../@types/ofx/common'
import { formatDate, parseDateToUtc } from './date'
import { isDebt } from './helpers'

type TransactionContext = {
  source: 'bank' | 'credit_card'
  transaction: StatementTransaction
  currency: string | null
  account: Record<string, any> | null
  institution: Record<string, any> | null
  path: string
}

function parseAmount(rawAmount: any): number | null {
  if (rawAmount === null || rawAmount === undefined) return null
  const amount = Number(String(rawAmount).replace(/,/g, '.'))
  if (Number.isNaN(amount)) return null
  return amount
}

function normalizeDescription(description: string): string {
  return description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function resolvePostedAt(
  dateValue: string,
  options: NormalizeOptions,
): { value: string | number | Date | null; warning?: OfxDiagnostic } {
  const dateMode = options.dateMode || 'formatted'
  if (!dateValue) {
    return {
      value: null,
      warning: {
        code: 'MISSING_DATE',
        message: 'Transaction does not include DTPOSTED.',
        severity: 'warning',
      },
    }
  }

  if (dateMode === 'raw') {
    return { value: dateValue }
  }

  if (dateMode === 'formatted') {
    return { value: formatDate(dateValue, options.formatDate || 'y-M-d') }
  }

  const parsedDate = parseDateToUtc(dateValue)
  if (!parsedDate) {
    return {
      value: null,
      warning: {
        code: 'INVALID_DATE',
        message: `Unable to parse date '${dateValue}'.`,
        severity: 'warning',
      },
    }
  }

  if (dateMode === 'date') return { value: parsedDate }
  if (dateMode === 'timestamp') return { value: parsedDate.getTime() }
  return { value: parsedDate.toISOString() }
}

function resolveAmount(
  rawAmount: any,
  amountMode: NormalizeOptions['amountMode'],
): {
  amount: number | string | null
  amountAbs: number | string | null
  warning?: OfxDiagnostic
} {
  const numericAmount = parseAmount(rawAmount)
  if (numericAmount === null) {
    return {
      amount: null,
      amountAbs: null,
      warning: {
        code: 'INVALID_AMOUNT',
        message: `Unable to parse amount '${String(rawAmount)}'.`,
        severity: 'warning',
      },
    }
  }

  if (amountMode === 'string') {
    return {
      amount: String(rawAmount),
      amountAbs: String(Math.abs(numericAmount)),
    }
  }

  if (amountMode === 'cents') {
    return {
      amount: Math.round(numericAmount * 100),
      amountAbs: Math.round(Math.abs(numericAmount) * 100),
    }
  }

  return {
    amount: numericAmount,
    amountAbs: Math.abs(numericAmount),
  }
}

function getTransactions(ofxData: OfxStructure): TransactionContext[] {
  const result: TransactionContext[] = []
  const institution = ofxData?.OFX?.SIGNONMSGSRSV1?.SONRS?.FI || null

  const bankStatement = ofxData?.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS
  const bankTransactions =
    bankStatement?.BANKTRANLIST?.STRTTRN || bankStatement?.BANKTRANLIST?.STMTTRN || []

  bankTransactions.forEach((transaction: StatementTransaction, index: number) => {
    result.push({
      source: 'bank',
      transaction,
      currency: bankStatement?.CURDEF || null,
      account: bankStatement?.BANKACCTFROM || null,
      institution,
      path: `OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.${index}`,
    })
  })

  const creditCardStatement =
    ofxData?.OFX?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS
  const creditCardTransactions =
    creditCardStatement?.BANKTRANLIST?.STRTTRN ||
    creditCardStatement?.BANKTRANLIST?.STMTTRN ||
    []

  creditCardTransactions.forEach(
    (transaction: StatementTransaction, index: number) => {
      result.push({
        source: 'credit_card',
        transaction,
        currency: creditCardStatement?.CURDEF || null,
        account: creditCardStatement?.CCACCTFROM || null,
        institution,
        path: `OFX.CREDITCARDMSGSRSV1.CCSTMTTRNRS.CCSTMTRS.BANKTRANLIST.${index}`,
      })
    },
  )

  return result
}

export function normalizeOfxData(
  data: OfxResponse,
  options: NormalizeOptions = {},
): NormalizedOfxData {
  const amountMode = options.amountMode || 'number'
  const warnings: OfxDiagnostic[] = []
  const transactions: NormalizedTransaction[] = []

  const rawTransactions = getTransactions(data as unknown as OfxStructure)

  rawTransactions.forEach(item => {
    const rowWarnings: OfxDiagnostic[] = []
    const description = String(
      item.transaction.MEMO || item.transaction.NAME || item.transaction.TRNTYPE || '',
    ).trim()

    const { amount, amountAbs, warning: amountWarning } = resolveAmount(
      item.transaction.TRNAMT,
      amountMode,
    )
    if (amountWarning) {
      amountWarning.path = item.path
      rowWarnings.push(amountWarning)
      warnings.push(amountWarning)
    }

    const postedAtResult = resolvePostedAt(item.transaction.DTPOSTED, options)
    if (postedAtResult.warning) {
      postedAtResult.warning.path = item.path
      rowWarnings.push(postedAtResult.warning)
      warnings.push(postedAtResult.warning)
    }

    transactions.push({
      source: item.source,
      direction: isDebt(item.transaction) ? 'debit' : 'credit',
      amount,
      amountAbs,
      postedAt: postedAtResult.value,
      description,
      descriptionNormalized: normalizeDescription(description),
      fitId: String(item.transaction.FITID || ''),
      currency: item.currency,
      account: item.account,
      institution: item.institution,
      raw: item.transaction,
      warnings: rowWarnings,
    })
  })

  return {
    transactions,
    warnings,
  }
}

export function validateOfxData(data: OfxResponse): ValidationReport {
  const warnings: OfxDiagnostic[] = []
  const errors: OfxDiagnostic[] = []
  const transactions = getTransactions(data as unknown as OfxStructure)

  if (!data?.OFX) {
    errors.push({
      code: 'MISSING_OFX_BLOCK',
      message: 'Missing OFX root block.',
      severity: 'error',
      path: 'OFX',
    })
  }

  if (!transactions.length) {
    warnings.push({
      code: 'NO_TRANSACTIONS_FOUND',
      message: 'No transactions were found in bank or credit card statements.',
      severity: 'warning',
      path: 'OFX',
    })
  }

  const fitIdCounter: { [key: string]: number } = {}

  transactions.forEach(item => {
    const fitId = String(item.transaction.FITID || '')
    if (!fitId) {
      warnings.push({
        code: 'MISSING_FITID',
        message: 'Transaction does not include FITID.',
        severity: 'warning',
        path: item.path,
      })
    } else {
      fitIdCounter[fitId] = (fitIdCounter[fitId] || 0) + 1
    }

    if (parseAmount(item.transaction.TRNAMT) === null) {
      errors.push({
        code: 'INVALID_AMOUNT',
        message: `Invalid amount '${String(item.transaction.TRNAMT)}'.`,
        severity: 'error',
        path: item.path,
      })
    }

    if (!parseDateToUtc(String(item.transaction.DTPOSTED || ''))) {
      warnings.push({
        code: 'INVALID_DATE',
        message: `Invalid DTPOSTED '${String(item.transaction.DTPOSTED || '')}'.`,
        severity: 'warning',
        path: item.path,
      })
    }
  })

  const duplicatedFitIds = Object.values(fitIdCounter).filter(v => v > 1).length
  if (duplicatedFitIds > 0) {
    warnings.push({
      code: 'DUPLICATED_FITID',
      message: `Found ${duplicatedFitIds} duplicated FITID values.`,
      severity: 'warning',
      path: 'OFX',
    })
  }

  const bankTransactions = transactions.filter(item => item.source === 'bank').length
  const creditCardTransactions = transactions.filter(
    item => item.source === 'credit_card',
  ).length

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    stats: {
      totalTransactions: transactions.length,
      bankTransactions,
      creditCardTransactions,
      duplicatedFitIds,
    },
  }
}
