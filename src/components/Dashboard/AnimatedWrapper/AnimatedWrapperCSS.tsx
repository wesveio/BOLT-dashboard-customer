import type { ReactNode } from 'react';

/**
 * CSS-based animated wrapper to replace Framer Motion version
 * This is a server component that uses CSS animations
 */
interface AnimatedWrapperCSSProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedWrapperCSS({ children, className = '' }: AnimatedWrapperCSSProps) {
  return <div className={`animate-fade-in ${className}`}>{children}</div>;
}

