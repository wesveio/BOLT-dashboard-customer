/**
 * Currency Service Tests
 */

import { describe, it, expect } from 'vitest';
import {
  convertCurrency,
  getExchangeRate,
  validateCurrency,
  isCurrencySupported,
  getDefaultCurrency,
  formatCurrencyAmount,
  getCurrencySymbol,
  getRegionalPrice,
} from '../currency-service';

describe('Currency Service', () => {
  describe('getExchangeRate', () => {
    it('should return 1.0 for same currency', () => {
      expect(getExchangeRate('USD', 'USD')).toBe(1.0);
      expect(getExchangeRate('BRL', 'BRL')).toBe(1.0);
    });

    it('should return correct rate from USD to BRL', () => {
      const rate = getExchangeRate('USD', 'BRL');
      expect(rate).toBeGreaterThan(0);
      expect(typeof rate).toBe('number');
    });

    it('should return correct rate from BRL to USD', () => {
      const rate = getExchangeRate('BRL', 'USD');
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1);
    });
  });

  describe('convertCurrency', () => {
    it('should return same amount for same currency', () => {
      expect(convertCurrency(100, 'USD', 'USD')).toBe(100);
      expect(convertCurrency(50, 'BRL', 'BRL')).toBe(50);
    });

    it('should convert USD to BRL correctly', () => {
      const result = convertCurrency(100, 'USD', 'BRL');
      expect(result).toBeGreaterThan(100);
      expect(typeof result).toBe('number');
    });

    it('should convert BRL to USD correctly', () => {
      const result = convertCurrency(500, 'BRL', 'USD');
      expect(result).toBeLessThan(500);
      expect(typeof result).toBe('number');
    });

    it('should round to 2 decimal places', () => {
      const result = convertCurrency(1, 'USD', 'BRL');
      const decimals = result.toString().split('.')[1];
      expect(decimals?.length || 0).toBeLessThanOrEqual(2);
    });
  });

  describe('validateCurrency', () => {
    it('should validate correct currency codes', () => {
      expect(validateCurrency('USD')).toBe('USD');
      expect(validateCurrency('BRL')).toBe('BRL');
      expect(validateCurrency('EUR')).toBe('EUR');
    });

    it('should convert to uppercase', () => {
      expect(validateCurrency('usd')).toBe('USD');
      expect(validateCurrency('brl')).toBe('BRL');
    });

    it('should throw error for invalid currency codes', () => {
      expect(() => validateCurrency('')).toThrow();
      expect(() => validateCurrency('US')).toThrow();
      expect(() => validateCurrency('USDD')).toThrow();
      expect(() => validateCurrency('123')).toThrow();
    });
  });

  describe('isCurrencySupported', () => {
    it('should return true for supported currencies', () => {
      expect(isCurrencySupported('USD')).toBe(true);
      expect(isCurrencySupported('BRL')).toBe(true);
    });

    it('should return false for unsupported currencies', () => {
      expect(isCurrencySupported('EUR')).toBe(false);
      expect(isCurrencySupported('GBP')).toBe(false);
    });
  });

  describe('getDefaultCurrency', () => {
    it('should return USD as default', () => {
      const originalEnv = process.env.DEFAULT_PAYMENT_CURRENCY;
      delete process.env.DEFAULT_PAYMENT_CURRENCY;
      
      expect(getDefaultCurrency()).toBe('USD');
      
      if (originalEnv) {
        process.env.DEFAULT_PAYMENT_CURRENCY = originalEnv;
      }
    });

    it('should return currency from environment variable', () => {
      const originalEnv = process.env.DEFAULT_PAYMENT_CURRENCY;
      process.env.DEFAULT_PAYMENT_CURRENCY = 'BRL';
      
      expect(getDefaultCurrency()).toBe('BRL');
      
      if (originalEnv) {
        process.env.DEFAULT_PAYMENT_CURRENCY = originalEnv;
      } else {
        delete process.env.DEFAULT_PAYMENT_CURRENCY;
      }
    });
  });

  describe('formatCurrencyAmount', () => {
    it('should format USD correctly', () => {
      const formatted = formatCurrencyAmount(100.5, 'USD');
      expect(formatted).toContain('$');
      expect(formatted).toContain('100.50');
    });

    it('should format BRL correctly', () => {
      const formatted = formatCurrencyAmount(100.5, 'BRL');
      expect(formatted).toContain('R$');
      expect(formatted).toContain('100.50');
    });

    it('should handle zero amounts', () => {
      const formatted = formatCurrencyAmount(0, 'USD');
      expect(formatted).toContain('0.00');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return correct symbols', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('BRL')).toBe('R$');
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    it('should return currency code for unknown currencies', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });
  });

  describe('getRegionalPrice', () => {
    it('should use regional pricing when available', () => {
      const regionalPricing = [
        { currency: 'BRL', amount: 1000 },
        { currency: 'USD', amount: 200 },
      ];
      
      const price = getRegionalPrice(200, 'USD', 'BRL', regionalPricing);
      expect(price).toBe(1000);
    });

    it('should convert from base currency when regional pricing not available', () => {
      const regionalPricing = [
        { currency: 'USD', amount: 200 },
      ];
      
      const price = getRegionalPrice(200, 'USD', 'BRL', regionalPricing);
      expect(price).toBeGreaterThan(200);
    });

    it('should convert when no regional pricing provided', () => {
      const price = getRegionalPrice(100, 'USD', 'BRL');
      expect(price).toBeGreaterThan(100);
    });
  });
});

