import {
  BANK_SERVICE_END,
  BANK_SERVICE_START,
  CREDIT_CARD_SERVICE_END,
  CREDIT_CARD_SERVICE_START,
} from '../common/constants'
import {
  fixJsonProblems,
  getConfiguredDate,
  getTransactionsSummary,
  getBankStatementTransactionsText,
  getCreditCardStatementTransactionsText,
} from '../common/parse'
import { OfxStructure } from '../@types/ofx/index'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { TransactionsSummary } from '../@types/common'

export class OfxExtractor extends CustomExtractor {
  setConfig(config: Config) {
    this.configInstance = config
  }

  getBankTransferList(data: string): any {
    const { newBankStatementTransactions } = getBankStatementTransactionsText(
      this.configInstance.getPartialJsonData(data),
    )
    if (!newBankStatementTransactions) return []
    return JSON.parse(`{${fixJsonProblems(newBankStatementTransactions)}}`)
      ?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STRTTRN
  }

  getCreditCardTransferList(data: string): any {
    const { newCreditCardStatementTransactions } =
      getCreditCardStatementTransactionsText(
        this.configInstance.getPartialJsonData(data),
      )
    if (!newCreditCardStatementTransactions) return []
    return JSON.parse(
      `{${fixJsonProblems(newCreditCardStatementTransactions)}}`,
    )?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS?.BANKTRANLIST?.STRTTRN
  }

  getTransactionsSummary(data: string) {
    let bankTransactions: any[] = []
    let creditCardTransactions: any[] = []
    try {
      bankTransactions = this.getBankTransferList(data) || []
    } catch {
      bankTransactions = []
    }
    try {
      creditCardTransactions = this.getCreditCardTransferList(data) || []
    } catch {
      creditCardTransactions = []
    }
    const transactions = bankTransactions.length
      ? bankTransactions
      : creditCardTransactions
    const blockStart = bankTransactions.length
      ? BANK_SERVICE_START
      : CREDIT_CARD_SERVICE_START
    const blockEnd = bankTransactions.length ? BANK_SERVICE_END : CREDIT_CARD_SERVICE_END
    const serviceStartIndex = data.indexOf(blockStart)
    const serviceEndIndex = data.indexOf(blockEnd)
    const sourceBlock =
      serviceStartIndex >= 0 && serviceEndIndex > serviceStartIndex
        ? data.slice(serviceStartIndex, serviceEndIndex + blockEnd.length)
        : ''
    const startMatch = sourceBlock.match(/<DTSTART>([^\n<]+)/)
    const endMatch = sourceBlock.match(/<DTEND>([^\n<]+)/)
    const summary = getTransactionsSummary(
      transactions || [],
    )
    const formattedStart = startMatch?.[1]
      ? getConfiguredDate({
          dateString: startMatch[1],
          formatDate: this.configInstance.getConfig().formatDate,
        })
      : ''
    const formattedEnd = endMatch?.[1]
      ? getConfiguredDate({
          dateString: endMatch[1],
          formatDate: this.configInstance.getConfig().formatDate,
        })
      : ''
    return {
      dateStart: formattedStart,
      dateEnd: formattedEnd,
      ...summary,
    } as unknown as TransactionsSummary
  }

  getContent(data: string): OfxStructure {
    const ofxText = this.configInstance.getPartialJsonData(data)
    const { newBankStatementTransactions, oldBankStatementTransactions } =
      getBankStatementTransactionsText(ofxText)
    const {
      newCreditCardStatementTransactions,
      oldCreditCardStatementTransactions,
    } = getCreditCardStatementTransactionsText(ofxText)
    let result = ofxText
    if (newBankStatementTransactions) {
      result = result.replace(
        oldBankStatementTransactions,
        newBankStatementTransactions,
      )
    }
    if (newCreditCardStatementTransactions) {
      result = result.replace(
        oldCreditCardStatementTransactions,
        newCreditCardStatementTransactions,
      )
    }
    return JSON.parse(`{${fixJsonProblems(result)}}`)
  }
}
