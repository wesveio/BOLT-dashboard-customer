'use client';

import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';

interface AnimatedWrapperProps {
  children: React.ReactNode;
}

export function AnimatedWrapper({ children }: AnimatedWrapperProps) {
  return (
    <m.div initial="hidden" animate="visible" exit="exit" variants={fadeIn}>
      {children}
    </m.div>
  );
}

