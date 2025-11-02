'use client';

import { ReactNode, memo } from 'react';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';

interface PageWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component with fadeIn animation
 * Standardized page structure that reduces boilerplate
 */
export const PageWrapper = memo(function PageWrapper({ children, className = '' }: PageWrapperProps) {
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={className}
    >
      {children}
    </m.div>
  );
});

