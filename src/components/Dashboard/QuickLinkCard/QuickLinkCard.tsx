'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardBody } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';

export interface QuickLinkCardProps {
  /**
   * URL to navigate to
   */
  href: string;
  /**
   * Icon component to display
   */
  icon: React.ReactNode;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description: string;
  /**
   * Gradient colors for icon background (e.g., 'from-blue-500 to-purple-500')
   */
  gradient?: string;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Reusable quick link card component
 * Provides consistent navigation card styling across the dashboard
 */
export const QuickLinkCard = memo(function QuickLinkCard({
  href,
  icon,
  title,
  description,
  gradient = 'from-blue-500 to-purple-500',
  className = '',
}: QuickLinkCardProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={className}
    >
      <Link href={href}>
        <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
          <CardBody className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-foreground">{title}</h3>
                <p className="text-sm text-foreground/70">{description}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </Link>
    </motion.div>
  );
});

