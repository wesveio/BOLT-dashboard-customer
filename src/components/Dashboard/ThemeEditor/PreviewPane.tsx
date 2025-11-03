'use client';

import { Card, CardBody } from '@heroui/react';
import { Button } from '@heroui/react';
import type { ExpandedThemeConfig } from './types';

interface PreviewPaneProps {
  config: ExpandedThemeConfig;
}

export function PreviewPane({ config }: PreviewPaneProps) {
  // Safely extract colors with fallbacks
  const colors = config?.visual?.colors;
  const typography = config?.visual?.typography;
  
  if (!colors || !typography) {
    return (
      <div className="text-center text-gray-500 py-8">
        Loading preview...
      </div>
    );
  }

  const backgroundColor = colors.background?.primary || '#ffffff';
  const textColor = colors.text?.primary || '#111827';
  const primaryColor = colors.primary?.from || '#2563eb';
  const secondaryColor = colors.secondary?.from || '#9333ea';
  const accentColor = colors.accent || '#f59e0b';
  const headingFont = typography.heading?.family || 'Inter';
  const bodyFont = typography.primary?.family || 'Inter';
  const layout = config?.layout?.type || config?.baseTheme || 'default';

  return (
    <div className="space-y-4">
      {/* Preview Container */}
      <div
        className="rounded-lg border-2 border-gray-200 p-4 min-h-[400px]"
        style={{ backgroundColor }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-bold"
              style={{
                color: textColor,
                fontFamily: headingFont,
              }}
            >
              Checkout Preview
            </h2>
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: primaryColor }} />
          </div>

          {/* Step Card */}
          <Card
            className="border"
            style={{
              borderColor: primaryColor + '40',
              backgroundColor,
            }}
          >
            <CardBody className="p-4">
              <div className="space-y-3">
                <div
                  className="text-sm font-semibold"
                  style={{ color: textColor, fontFamily: bodyFont }}
                >
                  Shipping Information
                </div>
                <div
                  className="text-xs"
                  style={{ color: textColor + 'CC', fontFamily: bodyFont }}
                >
                  Enter your shipping address
                </div>
                <div className="h-10 rounded border" style={{ borderColor: primaryColor + '40' }} />
              </div>
            </CardBody>
          </Card>

          {/* Button Preview */}
          <Button
            className="w-full font-bold"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
              color: '#ffffff',
            }}
          >
            Continue
          </Button>

          {/* Color Swatches */}
          <div className="grid grid-cols-5 gap-2 pt-4 border-t" style={{ borderColor: primaryColor + '20' }}>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xs" style={{ color: textColor, fontFamily: bodyFont }}>
                Primary
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: secondaryColor }}
              />
              <span className="text-xs" style={{ color: textColor, fontFamily: bodyFont }}>
                Secondary
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-xs" style={{ color: textColor, fontFamily: bodyFont }}>
                Accent
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1 border-2"
                style={{ backgroundColor, borderColor: textColor + '40' }}
              />
              <span className="text-xs" style={{ color: textColor, fontFamily: bodyFont }}>
                Bg
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: textColor }}
              />
              <span className="text-xs" style={{ color: textColor, fontFamily: bodyFont }}>
                Text
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Indicator */}
      <div className="text-center">
        <span className="text-xs text-gray-500">Layout: {layout}</span>
      </div>
    </div>
  );
}

