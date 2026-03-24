function separatePartsOfDate(date: string) {
  const year = date.slice(0, 4)
  const month = date.slice(4, 6)
  const day = date.slice(6, 8)
  const hour = date.slice(8, 10)
  const minutes = date.slice(10, 12)
  const seconds = date.slice(12, 14)
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

type ParsedDateParts = {
  year: number
  month: number
  day: number
  hour: number
  minutes: number
  seconds: number
}

function isLeapYear(year: number) {
  if (year % 400 === 0) return true
  if (year % 100 === 0) return false
  return year % 4 === 0
}

function getDaysInMonth(month: number, year: number) {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  if ([4, 6, 9, 11].includes(month)) return 30
  return 31
}

function parseIsoDate(date: string): ParsedDateParts | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const [year, month, day] = date.split('-').map(Number)
  return {
    year,
    month,
    day,
    hour: 0,
    minutes: 0,
    seconds: 0,
  }
}

function parseIsoDateTime(date: string): ParsedDateParts | null {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(date)) return null
  const match = date.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):?(\d{2})(?::?(\d{2}))?(?:\.\d+)?(?:([+-]\d{2}):?(\d{2})|Z)?$/,
  )
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const hour = Number(match[4])
  const minutes = Number(match[5])
  const seconds = Number(match[6] || '0')
  const localParts = {
    year,
    month,
    day,
    hour,
    minutes,
    seconds,
  }
  if (!isValidParsedDate(localParts)) return null
  const offsetHour = Number(match[7] || '0')
  const offsetMinutes = Number(match[8] || '0')
  const offsetTotalMinutes =
    offsetHour < 0
      ? offsetHour * 60 - offsetMinutes
      : offsetHour * 60 + offsetMinutes
  const asDate = new Date(
    Date.UTC(year, month - 1, day, hour, minutes, seconds) -
      offsetTotalMinutes * 60_000,
  )
  if (Number.isNaN(asDate.getTime())) return null
  return {
    year: asDate.getUTCFullYear(),
    month: asDate.getUTCMonth() + 1,
    day: asDate.getUTCDate(),
    hour: asDate.getUTCHours(),
    minutes: asDate.getUTCMinutes(),
    seconds: asDate.getUTCSeconds(),
  }
}

function parseOfxDateString(date: string): ParsedDateParts | null {
  const withoutTimezone = date.split('[')[0]
  const normalized = withoutTimezone.split('.')[0]
  if (!/^\d{8}(\d{6})?$/.test(normalized)) return null
  return {
    year: Number(normalized.slice(0, 4)),
    month: Number(normalized.slice(4, 6)),
    day: Number(normalized.slice(6, 8)),
    hour: Number(normalized.slice(8, 10) || '00'),
    minutes: Number(normalized.slice(10, 12) || '00'),
    seconds: Number(normalized.slice(12, 14) || '00'),
  }
}

function parseSeparatedDate(date: string): ParsedDateParts | null {
  const match = date.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})$/)
  if (!match) return null
  const left = Number(match[1])
  const middle = Number(match[2])
  const right = Number(match[3])
  const isYearFirst = String(match[1]).length === 4
  const isYearLast = String(match[3]).length === 4
  if (!isYearFirst && !isYearLast) return null
  return {
    year: isYearFirst ? left : right,
    month: middle,
    day: isYearFirst ? right : left,
    hour: 0,
    minutes: 0,
    seconds: 0,
  }
}

export function parseDateParts(date: string): ParsedDateParts | null {
  return (
    parseIsoDate(date) ||
    parseIsoDateTime(date) ||
    parseSeparatedDate(date) ||
    parseOfxDateString(date)
  )
}

export function isValidParsedDate(parts: ParsedDateParts): boolean {
  if (
    !Number.isFinite(parts.year) ||
    !Number.isFinite(parts.month) ||
    !Number.isFinite(parts.day) ||
    !Number.isFinite(parts.hour) ||
    !Number.isFinite(parts.minutes) ||
    !Number.isFinite(parts.seconds)
  ) {
    return false
  }

  if (parts.month < 1 || parts.month > 12) return false
  if (parts.day < 1 || parts.day > getDaysInMonth(parts.month, parts.year))
    return false
  if (parts.hour < 0 || parts.hour > 23) return false
  if (parts.minutes < 0 || parts.minutes > 59) return false
  if (parts.seconds < 0 || parts.seconds > 59) return false
  return true
}

export function parseDateToUtc(date: string): Date | null {
  const parts = parseDateParts(date)
  if (!parts || !isValidParsedDate(parts)) return null
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minutes,
      parts.seconds,
    ),
  )
}
