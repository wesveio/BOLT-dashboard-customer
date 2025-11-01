'use client';

import { Card, CardBody } from '@heroui/react';
import { Button } from '@heroui/react';
import type { ThemeConfig } from './ThemeEditor';

interface PreviewPaneProps {
  config: ThemeConfig;
}

export function PreviewPane({ config }: PreviewPaneProps) {
  return (
    <div className="space-y-4">
      {/* Preview Container */}
      <div
        className="rounded-lg border-2 border-gray-200 p-4 min-h-[400px]"
        style={{ backgroundColor: config.colors.background }}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2
              className="text-xl font-bold"
              style={{
                color: config.colors.text,
                fontFamily: config.fonts.heading,
              }}
            >
              Checkout Preview
            </h2>
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: config.colors.primary }} />
          </div>

          {/* Step Card */}
          <Card
            className="border"
            style={{
              borderColor: config.colors.primary + '40',
              backgroundColor: config.colors.background,
            }}
          >
            <CardBody className="p-4">
              <div className="space-y-3">
                <div
                  className="text-sm font-semibold"
                  style={{ color: config.colors.text, fontFamily: config.fonts.body }}
                >
                  Shipping Information
                </div>
                <div
                  className="text-xs"
                  style={{ color: config.colors.text + 'CC', fontFamily: config.fonts.body }}
                >
                  Enter your shipping address
                </div>
                <div className="h-10 rounded border" style={{ borderColor: config.colors.primary + '40' }} />
              </div>
            </CardBody>
          </Card>

          {/* Button Preview */}
          <Button
            className="w-full font-bold"
            style={{
              background: `linear-gradient(to right, ${config.colors.primary}, ${config.colors.secondary})`,
              color: '#ffffff',
            }}
          >
            Continue
          </Button>

          {/* Color Swatches */}
          <div className="grid grid-cols-5 gap-2 pt-4 border-t" style={{ borderColor: config.colors.primary + '20' }}>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: config.colors.primary }}
              />
              <span className="text-xs" style={{ color: config.colors.text, fontFamily: config.fonts.body }}>
                Primary
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: config.colors.secondary }}
              />
              <span className="text-xs" style={{ color: config.colors.text, fontFamily: config.fonts.body }}>
                Secondary
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: config.colors.accent }}
              />
              <span className="text-xs" style={{ color: config.colors.text, fontFamily: config.fonts.body }}>
                Accent
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1 border-2"
                style={{ backgroundColor: config.colors.background, borderColor: config.colors.text + '40' }}
              />
              <span className="text-xs" style={{ color: config.colors.text, fontFamily: config.fonts.body }}>
                Bg
              </span>
            </div>
            <div className="text-center">
              <div
                className="w-8 h-8 rounded mx-auto mb-1"
                style={{ backgroundColor: config.colors.text }}
              />
              <span className="text-xs" style={{ color: config.colors.text, fontFamily: config.fonts.body }}>
                Text
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Indicator */}
      <div className="text-center">
        <span className="text-xs text-gray-500">Layout: {config.layout}</span>
      </div>
    </div>
  );
}

