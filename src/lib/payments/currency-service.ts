/**
 * Currency Service
 * 
 * Handles currency conversion and regional pricing
 */

export type CurrencyCode = 'USD' | 'BRL' | string;

/**
 * Exchange rates (can be updated from external API)
 * Default rates are approximate - in production, fetch from a currency API
 */
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  BRL: 5.0, // Example: 1 USD = 5 BRL (update with real rates)
};

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES: CurrencyCode[] = ['USD', 'BRL'];

/**
 * Get exchange rate from base currency to target currency
 */
export function getExchangeRate(from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1.0;

  // If converting from USD, use direct rate
  if (from === 'USD') {
    return DEFAULT_EXCHANGE_RATES[to] || 1.0;
  }

  // If converting to USD, use inverse rate
  if (to === 'USD') {
    return 1.0 / (DEFAULT_EXCHANGE_RATES[from] || 1.0);
  }

  // Convert via USD
  const toUsd = 1.0 / (DEFAULT_EXCHANGE_RATES[from] || 1.0);
  const fromUsd = DEFAULT_EXCHANGE_RATES[to] || 1.0;
  return toUsd * fromUsd;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;

  const rate = getExchangeRate(from, to);
  return Math.round(amount * rate * 100) / 100; // Round to 2 decimal places
}

/**
 * Get default currency from environment or user preference
 */
export function getDefaultCurrency(): CurrencyCode {
  return (process.env.DEFAULT_PAYMENT_CURRENCY || 'USD') as CurrencyCode;
}

/**
 * Check if currency is supported
 */
export function isCurrencySupported(currency: CurrencyCode): boolean {
  return SUPPORTED_CURRENCIES.includes(currency);
}

/**
 * Validate currency code
 */
export function validateCurrency(currency: string): CurrencyCode {
  if (!currency || currency.length !== 3) {
    throw new Error('Invalid currency code. Must be ISO 4217 format (3 letters)');
  }

  const upperCurrency = currency.toUpperCase() as CurrencyCode;
  
  if (!isCurrencySupported(upperCurrency)) {
    console.warn(`⚠️ [DEBUG] Currency ${upperCurrency} not in supported list, but allowing it`);
  }

  return upperCurrency;
}

/**
 * Format currency amount for display
 */
export function formatCurrencyAmount(amount: number, currency: CurrencyCode): string {
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(amount);
  } catch (error) {
    // Fallback formatting
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  const symbols: Record<string, string> = {
    USD: '$',
    BRL: 'R$',
    EUR: '€',
    GBP: '£',
  };

  return symbols[currency] || currency;
}

/**
 * Regional pricing configuration
 * Allows different base prices per region/currency
 */
export interface RegionalPricing {
  currency: CurrencyCode;
  amount: number;
  region?: string;
}

/**
 * Get regional price for a plan
 * If regional pricing is not available, convert from base price
 */
export function getRegionalPrice(
  baseAmount: number,
  baseCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  regionalPricing?: RegionalPricing[]
): number {
  // If regional pricing is provided, use it
  if (regionalPricing) {
    const regional = regionalPricing.find((p) => p.currency === targetCurrency);
    if (regional) {
      return regional.amount;
    }
  }

  // Otherwise, convert from base currency
  return convertCurrency(baseAmount, baseCurrency, targetCurrency);
}

/**
 * Fetch exchange rates from external API (optional)
 * In production, implement this to fetch real-time rates
 */
export async function fetchExchangeRates(): Promise<Record<string, number>> {
  // TODO: Implement API call to fetch real exchange rates
  // Example: https://api.exchangerate-api.com/v4/latest/USD
  // For now, return default rates
  return DEFAULT_EXCHANGE_RATES;
}

