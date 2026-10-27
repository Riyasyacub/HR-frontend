const isoDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function currentMonthPeriod() {
  const today = new Date()
  return { from: isoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)) }
}
