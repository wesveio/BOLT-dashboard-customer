'use client';

import React from 'react';
import { Spinner as HeroUISpinner } from '@heroui/react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

/**
 * Standardized Spinner component
 * Wrapper around HeroUI Spinner for consistent usage across the application
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  return <HeroUISpinner size={size} color={color} className={className} />;
};

