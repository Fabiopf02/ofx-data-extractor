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
