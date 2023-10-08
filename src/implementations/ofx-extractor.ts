import {
  fixJsonProblems,
  getBankTransferListText,
  getTransactionsSummary,
} from '../common/parse'
import { OfxStructure } from '../@types/ofx'
import { CustomExtractor } from '../interfaces/custom-extractor.interface'
import { Config } from '../common/config'
import { TransactionsSummary } from '../@types/common'

export class OfxExtractor extends CustomExtractor {
  setConfig(config: Config) {
    this.configInstance = config
  }

  getBankTransferList(data: string): any {
    const { newListText } = getBankTransferListText(
      this.configInstance.getPartialJsonData(data),
    )
    const list = newListText.slice(10)
    const fixedList = fixJsonProblems(list)
    return JSON.parse(fixedList)
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
    const { newListText, oldListText } = getBankTransferListText(ofxText)
    const result = ofxText.replace(oldListText, newListText)
    return JSON.parse(`{${fixJsonProblems(result)}}`)
  }
}
