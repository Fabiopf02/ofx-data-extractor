import {
  fixJsonProblems,
  getBankStatementTransactionsText,
  getCreditCardStatementTransactionsText,
  getTransactionsSummary,
} from '../common/parse'
import { OfxStructure } from '../@types/ofx'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { TransactionsSummary } from '../@types/common'
import { writeFileSync } from 'fs'
import path from 'path'

export class OfxExtractor extends CustomExtractor {
  setConfig(config: Config) {
    this.configInstance = config
  }

  getBankTransferList(data: string): any {
    const { newBankStatementTransactions } = getBankStatementTransactionsText(
      this.configInstance.getPartialJsonData(data),
    )
    return JSON.parse(`{${fixJsonProblems(newBankStatementTransactions)}}`)
      ?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STRTTRN
  }

  getCreditCardTransferList(data: string): any {
    const { newCreditCardStatementTransactions } =
      getCreditCardStatementTransactionsText(
        this.configInstance.getPartialJsonData(data),
      )
    return JSON.parse(
      `{${fixJsonProblems(newCreditCardStatementTransactions)}}`,
    )?.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS?.BANKTRANLIST?.STRTTRN
  }

  getTransactionsSummary(data: string) {
    const jsonData = this.getContent(data)
    const {
      DTEND,
      DTSTART,
      STRTTRN: transactions,
    } = jsonData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST
    const summary = getTransactionsSummary(transactions)
    return {
      dateStart: DTSTART,
      dateEnd: DTEND,
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
    const result = ofxText
      .replace(
        oldCreditCardStatementTransactions,
        newCreditCardStatementTransactions,
      )
      .replace(oldBankStatementTransactions, newBankStatementTransactions)
    return JSON.parse(`{${fixJsonProblems(result)}}`)
  }
}
