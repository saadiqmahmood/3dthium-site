export function formatMoney(amount: number | string): string {
  return `£${Number(amount).toFixed(2)}`
}
