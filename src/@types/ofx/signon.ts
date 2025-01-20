export type SignOnResponse = {
  SONRS: SignOnStatus
}

export type SignOnStatus = {
  STATUS: Status
  DTSERVER: string
  LANGUAGE: string
  FI?: FinancialInstitution
}

export type Status = {
  CODE: number | string
  SEVERITY: 'INFO' | 'WARN' | 'ERROR'
  MESSAGE?: string
}

export type FinancialInstitution = {
  ORG: string
  FID: string
}
