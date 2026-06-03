/**
 * Standard utility to format monetary values across the application.
 * If the currency is COP or USD, the value is formatted in thousands (miles),
 * dividing by 1000 and appending the appropriate local suffix ("mil COP", "mil USD" or "$K").
 *
 * @param amount The numeric amount to format
 * @param currency The ISO code of the currency (e.g. 'EUR', 'USD', 'COP')
 * @param lang Language preference ('es' or 'en')
 * @param options Formatter configuration options
 */
export function formatCurrencyValue(
  amount: number,
  currency: string = 'EUR',
  lang: 'es' | 'en' = 'es',
  options?: { showDecimals?: boolean }
): string {
  const cleanCurrency = (currency || 'EUR').toUpperCase();
  const numericAmount = Number(amount) || 0;

  if (cleanCurrency === 'COP') {
    const decimals = options?.showDecimals ? 2 : (numericAmount % 1 === 0 ? 0 : 2);
    const formatted = numericAmount.toLocaleString(lang === 'es' ? 'es-CO' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return `${formatted} COP`;
  }

  if (cleanCurrency === 'USD') {
    const decimals = options?.showDecimals ? 2 : (numericAmount % 1 === 0 ? 0 : 2);
    const formatted = numericAmount.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    if (lang === 'es') {
      return `${formatted} USD`;
    } else {
      return `$${formatted}`;
    }
  }

  // EUR formatting
  if (cleanCurrency === 'EUR') {
    const formatted = numericAmount.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return lang === 'es' ? `${formatted} €` : `€${formatted}`;
  }

  // GBP formatting
  if (cleanCurrency === 'GBP') {
    const formatted = numericAmount.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `£${formatted}`;
  }

  // JPY formatting
  if (cleanCurrency === 'JPY') {
    const formatted = numericAmount.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `¥${formatted}`;
  }

  // Fallback for other currencies
  const formatted = numericAmount.toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${cleanCurrency}`;
}

/**
 * Formats a number to a compact string format (e.g. 1.2K, -35K, 2.5M).
 * 
 * @param value The numeric value to format
 * @returns The formatted compact string
 */
export function formatCompactNumber(value: number): string {
  const absValue = Math.abs(value);
  const isNegative = value < 0;
  
  if (absValue === 0) return '0';
  
  let formatted = '';
  if (absValue >= 1e9) {
    formatted = (absValue / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (absValue >= 1e6) {
    formatted = (absValue / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (absValue >= 1e3) {
    formatted = (absValue / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    formatted = absValue.toString();
  }
  
  return isNegative ? `-${formatted}` : formatted;
}

