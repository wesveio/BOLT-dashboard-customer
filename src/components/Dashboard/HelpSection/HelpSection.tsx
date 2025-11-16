'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export interface HelpSectionItem {
  key: string;
  title: string;
  description: string;
  example?: string;
}

export interface HelpSectionData {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: HelpSectionItem[];
}

interface HelpSectionProps {
  title: string;
  subtitle: string;
  sections: HelpSectionData[];
  defaultExpandedSections?: string[];
}

export function HelpSection({
  title,
  subtitle,
  sections,
  defaultExpandedSections = [],
}: HelpSectionProps) {
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(defaultExpandedSections)
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="mb-8"
    >
      <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <button
            onClick={() => setIsCardExpanded(!isCardExpanded)}
            className="w-full flex items-center justify-between gap-3 mb-0 text-left hover:opacity-80 transition-opacity duration-200"
            aria-expanded={isCardExpanded}
            aria-controls="help-content"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <QuestionMarkCircleIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">
                  {title}
                </h3>
                <p className="text-sm text-foreground/70 mt-1">
                  {subtitle}
                </p>
              </div>
            </div>
            {isCardExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-foreground/50 flex-shrink-0" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-foreground/50 flex-shrink-0" />
            )}
          </button>

          <AnimatePresence>
            {isCardExpanded && (
              <motion.div
                id="help-content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-3">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSections.has(section.id);

                    return (
                      <div
                        key={section.id}
                        className="border border-default-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-primary/30"
                      >
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-default-100 transition-colors duration-200"
                          aria-expanded={isExpanded}
                          aria-controls={`section-${section.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-foreground">
                              {section.title}
                            </h4>
                          </div>
                          {isExpanded ? (
                            <ChevronUpIcon className="w-5 h-5 text-foreground/50" />
                          ) : (
                            <ChevronDownIcon className="w-5 h-5 text-foreground/50" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              id={`section-${section.id}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-0 space-y-4 bg-default-50">
                                {section.items.map((item) => (
                                  <div
                                    key={item.key}
                                    className="p-4 bg-background rounded-lg border border-default"
                                  >
                                    <h5 className="font-semibold text-foreground mb-2">
                                      {item.title}
                                    </h5>
                                    <p className="text-sm text-foreground/80 mb-2">
                                      {item.description}
                                    </p>
                                    {item.example && (
                                      <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                        <p className="text-xs font-medium text-primary mb-1">
                                          Example:
                                        </p>
                                        <p className="text-xs text-primary/80">
                                          {item.example}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardBody>
      </Card>
    </motion.div>
  );
}

