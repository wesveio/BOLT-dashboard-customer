'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { motion as m } from 'framer-motion';

interface OtpInputProps {
  /**
   * The OTP code value (6 digits)
   */
  value: string;
  /**
   * Callback when the OTP value changes
   */
  onChange: (value: string) => void;
  /**
   * Whether the input is disabled
   */
  isDisabled?: boolean;
  /**
   * Whether the input has an error
   */
  isInvalid?: boolean;
  /**
   * Label for the input
   */
  label?: string;
  /**
   * Placeholder text below the input
   */
  placeholder?: string;
  /**
   * Number of OTP digits (default: 6)
   */
  length?: number;
  /**
   * Auto-focus the first input on mount
   */
  autoFocus?: boolean;
}

/**
 * OTP Input Component
 * 
 * A styled OTP input component with individual digit inputs,
 * auto-focus, paste handling, and keyboard navigation.
 * Follows the design system guidelines.
 */
export function OtpInput({
  value,
  onChange,
  isDisabled = false,
  isInvalid = false,
  label,
  placeholder,
  length = 6,
  autoFocus = true,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && !isDisabled && inputRefs.current[0]) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [autoFocus, isDisabled]);

  // Sync value to inputs (for controlled component)
  const inputValues = value.split('').slice(0, length);

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    const digit = newValue.replace(/\D/g, '').slice(0, 1);
    
    // Get current code array
    const currentCode = value.split('');
    while (currentCode.length < length) {
      currentCode.push('');
    }
    
    if (digit) {
      currentCode[index] = digit;
      const updatedCode = currentCode.slice(0, length).join('');
      onChange(updatedCode);

      // Auto-focus next input
      if (index < length - 1 && inputRefs.current[index + 1]) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 0);
      }
    } else {
      // Allow clearing - if backspace on empty field, go to previous
      if (newValue === '' && index > 0) {
        currentCode[index] = '';
        onChange(currentCode.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        currentCode[index] = '';
        onChange(currentCode.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = value.split('');
      newCode[index - 1] = '';
      onChange(newCode.join(''));
    }
    // Handle arrow keys
    else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Prevent non-digit characters
    else if (e.key.length === 1 && !/\d/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData.length > 0) {
      onChange(pastedData);
      
      // Focus the next empty input or the last input
      const focusIndex = Math.min(pastedData.length, length - 1);
      if (inputRefs.current[focusIndex]) {
        inputRefs.current[focusIndex]?.focus();
      }
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {label && (
        <label className="block text-sm font-semibold mb-2 text-foreground/80">
          {label}
        </label>
      )}

      <div className="flex gap-2 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={inputValues[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={isDisabled}
            className={`
              w-12 h-14 text-2xl font-mono text-center
              border-2 rounded-lg
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-1
              disabled:bg-default-100 disabled:cursor-not-allowed
              ${
                isInvalid
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-default-200 hover:border-primary/30 focus:border-primary focus:ring-primary/20'
              }
            `}
            aria-label={`Digit ${index + 1} of ${length}`}
          />
        ))}
      </div>

      {placeholder && (
        <p className="text-xs text-foreground/60 mt-2 text-center">{placeholder}</p>
      )}
    </m.div>
  );
}
