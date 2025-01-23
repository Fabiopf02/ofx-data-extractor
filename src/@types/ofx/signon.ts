export type SignOnResponse = {
  SONRS: SignOnStatus
  [key: string]: any
}

export type SignOnStatus = {
  STATUS: Status
  DTSERVER: string
  LANGUAGE: string
  FI?: FinancialInstitution
  [key: string]: any
}

export type Status = {
  CODE: number | string
  SEVERITY: 'INFO' | 'WARN' | 'ERROR'
  MESSAGE?: string
  [key: string]: any
}

export type FinancialInstitution = {
  ORG: string
  FID: string
  [key: string]: any
}
