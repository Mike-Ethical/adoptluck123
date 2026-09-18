/**
 * Compact Value Formatter
 * Formats values like 1000 -> "1K", 1500 -> "1.5K", 1000000 -> "1M"
 * Omits unnecessary trailing zeros.
 */
export function formatCompactValue(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  if (num === 0) return '0';

  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}M`;
  }

  if (abs >= 1_000) {
    const formatted = (abs / 1_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${formatted}K`;
  }

  // Under 1000: round to at most 1 decimal place without trailing zero
  const rounded = Math.round(abs * 10) / 10;
  return `${sign}${rounded}`;
}

export const formatValue = formatCompactValue;
