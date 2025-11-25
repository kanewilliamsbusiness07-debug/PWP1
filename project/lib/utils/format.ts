/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currency Currency code (default: AUD)
 * @param locale Locale code (default: en-AU)
 */
export function formatCurrency(
  amount: number,
  currency: string = 'AUD',
  locale: string = 'en-AU'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format a number as a percentage
 * @param value Value to format as percentage (e.g., 0.05 for 5%)
 * @param locale Locale code (default: en-AU)
 */
export function formatPercentage(
  value: number,
  locale: string = 'en-AU'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
}