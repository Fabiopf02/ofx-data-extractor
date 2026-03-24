import { parseDateToUtc, parseDateParts } from '../src/common/date'

describe('Date parsing utilities', () => {
  test('Should parse OFX date with time and timezone suffix', () => {
    const parsed = parseDateToUtc('20260324153045[-3:BRT]')
    expect(parsed?.toISOString()).toBe('2026-03-24T15:30:45.000Z')
  })

  test('Should parse plain YYYY-MM-DD', () => {
    const parsed = parseDateToUtc('2026-03-24')
    expect(parsed?.toISOString()).toBe('2026-03-24T00:00:00.000Z')
  })

  test('Should parse ISO datetime', () => {
    const parsed = parseDateToUtc('2026-03-24T10:20:30.000Z')
    expect(parsed?.toISOString()).toBe('2026-03-24T10:20:30.000Z')
  })

  test('Should parse timezone-less ISO datetime as UTC', () => {
    const parsed = parseDateToUtc('2026-03-24T10:20:30')
    expect(parsed?.toISOString()).toBe('2026-03-24T10:20:30.000Z')
  })

  test('Should parse separated formatted dates (d/M/y)', () => {
    const parsed = parseDateToUtc('09/03/2018')
    expect(parsed?.toISOString()).toBe('2018-03-09T00:00:00.000Z')
  })

  test('Should parse OFX compact datetime parts', () => {
    const parts = parseDateParts('20260324102030')
    expect(parts).toBeDefined()
    expect(parts?.year).toBe(2026)
    expect(parts?.month).toBe(3)
    expect(parts?.day).toBe(24)
    expect(parts?.hour).toBe(10)
    expect(parts?.minutes).toBe(20)
    expect(parts?.seconds).toBe(30)
  })

  test('Should reject invalid ISO datetime parts', () => {
    const parts = parseDateParts('2026-13-44T99:99:99Z')
    expect(parts).toBeNull()
  })

  test('Should reject invalid leap year date', () => {
    const parsed = parseDateToUtc('20230229000000')
    expect(parsed).toBeNull()
  })

  test('Should accept valid leap year date', () => {
    const parsed = parseDateToUtc('20240229000000')
    expect(parsed?.toISOString()).toBe('2024-02-29T00:00:00.000Z')
  })

  test('Should reject invalid month/day/hour/minutes/seconds', () => {
    expect(parseDateToUtc('20261301000000')).toBeNull()
    expect(parseDateToUtc('20261232000000')).toBeNull()
    expect(parseDateToUtc('20261201240000')).toBeNull()
    expect(parseDateToUtc('20261201236000')).toBeNull()
    expect(parseDateToUtc('20261201235960')).toBeNull()
  })
})
