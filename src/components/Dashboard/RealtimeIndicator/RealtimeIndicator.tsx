'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RealtimeIndicatorProps {
  isActive?: boolean;
  pulse?: boolean;
}

export function RealtimeIndicator({
  isActive = true,
  pulse = true,
}: RealtimeIndicatorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isActive) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <AnimatePresence>
          {pulse && (
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </AnimatePresence>
        <span className="text-xs font-semibold text-gray-600">Live</span>
      </div>
    </div>
  );
}

