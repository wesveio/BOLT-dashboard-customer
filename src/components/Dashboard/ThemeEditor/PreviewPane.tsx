'use client';

import { Card, CardBody, Chip, Button } from '@heroui/react';
import type { ExpandedThemeConfig } from './types';

interface PreviewPaneProps {
  config: ExpandedThemeConfig;
}

export function PreviewPane({ config }: PreviewPaneProps) {
  // Safely extract configuration with fallbacks
  const colors = config?.visual?.colors || {};
  const typography = config?.visual?.typography || {};
  const layout = config?.layout || {};
  const animations = config?.visual?.animations || {};
  
  const backgroundColor = colors.background?.primary || '#f9fafb';
  const textColor = colors.text?.primary || '#111827';
  const textSecondaryColor = colors.text?.secondary || '#6b7280';
  const primaryColor = colors.primary?.from || '#2563eb';
  const primaryColorTo = colors.primary?.to || colors.primary?.from || '#3b82f6';
  const secondaryColor = colors.secondary?.from || '#9333ea';
  const accentColor = colors.accent || '#f59e0b';
  const successColor = colors.success || '#10b981';
  const headingFont = typography.heading?.family || 'Inter';
  const bodyFont = typography.primary?.family || 'Inter';
  const layoutType = layout.type || config?.baseTheme || 'step-by-step';
  // Use fallback values for borderRadius since it's not in the VisualConfig type
  const cardRadius = '0.75rem';
  const buttonRadius = '0.5rem';

  // Check if glassmorphism is enabled (it's in colors, not features)
  const isGlassmorphism = !!colors.glassmorphism;
  const glassStyle = isGlassmorphism
    ? {
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }
    : {};

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Live Preview</h3>
          <p className="text-sm text-foreground/60">
            See how your theme will look in the checkout
          </p>
        </div>
        <Chip size="sm" variant="flat" color="primary">
          {layoutType.replace('-', ' ')}
        </Chip>
      </div>

      {/* Preview Container */}
      <div
        className="rounded-xl border-2 border-default p-6 min-h-[500px] relative overflow-hidden"
        style={{
          backgroundColor: backgroundColor,
        }}
      >
        {/* Animated background overlay if enabled */}
        {animations.animatedBackground && (
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `linear-gradient(45deg, ${primaryColor}22, ${secondaryColor}22, ${accentColor}22)`,
              backgroundSize: '200% 200%',
              animation: 'gradient 15s ease infinite',
            }}
          />
        )}

        <div className="relative z-10 space-y-4">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{
                  color: textColor,
                  fontFamily: headingFont,
                }}
              >
                Checkout Preview
              </h2>
              <p
                className="text-sm"
                style={{
                  color: textSecondaryColor,
                  fontFamily: bodyFont,
                }}
              >
                3 items in cart
              </p>
            </div>
            {config?.branding?.logo?.url && (
              <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center shadow-sm">
                <img
                  src={config.branding.logo.url}
                  alt={config.branding.logo.altText || 'Logo'}
                  className="max-w-full max-h-full"
                />
              </div>
            )}
          </div>

          {/* Step Card Preview */}
          <Card
            className="border transition-all hover:shadow-lg"
            style={{
              ...glassStyle,
              borderRadius: cardRadius,
              borderColor: colors.border?.default || `${primaryColor}40`,
              backgroundColor: isGlassmorphism ? 'transparent' : backgroundColor,
            }}
          >
            <CardBody className="p-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      background: `linear-gradient(to right, ${primaryColor}, ${primaryColorTo})`,
                    }}
                  >
                    1
                  </div>
                  <h3
                    className="text-lg font-bold"
                    style={{
                      color: textColor,
                      fontFamily: headingFont,
                    }}
                  >
                    Shipping Information
                  </h3>
                </div>
                <p
                  className="text-sm"
                  style={{
                    color: textSecondaryColor,
                    fontFamily: bodyFont,
                  }}
                >
                  Enter your delivery address
                </p>
                <div
                  className="h-12 rounded-lg border px-3 flex items-center"
                  style={{
                    borderColor: colors.border?.default || `${primaryColor}40`,
                    backgroundColor: isGlassmorphism ? 'rgba(255, 255, 255, 0.1)' : backgroundColor,
                    borderRadius: '0.5rem',
                  }}
                >
                  <span
                    className="text-sm"
                    style={{
                      color: textSecondaryColor,
                      fontFamily: bodyFont,
                    }}
                  >
                    Street address...
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Order Summary Preview */}
          <Card
            className="border"
            style={{
              ...glassStyle,
              borderRadius: cardRadius,
              borderColor: colors.border?.default || `${primaryColor}40`,
              backgroundColor: isGlassmorphism ? 'transparent' : backgroundColor,
            }}
          >
            <CardBody className="p-4">
              <div className="space-y-3">
                <h4
                  className="text-base font-semibold"
                  style={{
                    color: textColor,
                    fontFamily: headingFont,
                  }}
                >
                  Order Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{
                        color: textSecondaryColor,
                        fontFamily: bodyFont,
                      }}
                    >
                      Subtotal
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{
                        color: textColor,
                        fontFamily: bodyFont,
                      }}
                    >
                      $299.99
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span
                      className="text-sm"
                      style={{
                        color: textSecondaryColor,
                        fontFamily: bodyFont,
                      }}
                    >
                      Shipping
                    </span>
                    <Chip
                      size="sm"
                      variant="flat"
                      color="success"
                      style={{
                        backgroundColor: `${successColor}20`,
                        color: successColor,
                      }}
                    >
                      FREE
                    </Chip>
                  </div>
                  <div className="border-t pt-2 mt-2" style={{ borderColor: `${primaryColor}20` }}>
                    <div className="flex justify-between items-center">
                      <span
                        className="font-bold"
                        style={{
                          color: textColor,
                          fontFamily: headingFont,
                        }}
                      >
                        Total
                      </span>
                      <span
                        className="text-xl font-bold"
                        style={{
                          color: textColor,
                          fontFamily: headingFont,
                        }}
                      >
                        $299.99
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Button Preview */}
          <Button
            className="w-full font-bold text-base py-6 shadow-lg hover:shadow-xl transition-all duration-200"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${primaryColorTo})`,
              color: '#ffffff',
              borderRadius: buttonRadius,
            }}
          >
            Continue to Payment
          </Button>

          {/* Feature Indicators */}
          <div className="flex flex-wrap gap-2 pt-2">
            {colors.glassmorphism && (
              <Chip size="sm" variant="flat" color="default">
                Glassmorphism
              </Chip>
            )}
            {animations.animatedBackground && (
              <Chip size="sm" variant="flat" color="default">
                Animated BG
              </Chip>
            )}
            {animations.scrollBehavior === 'smooth' && (
              <Chip size="sm" variant="flat" color="default">
                Smooth Scroll
              </Chip>
            )}
          </div>
        </div>
      </div>

      {/* Color Palette Swatches */}
      <div className="grid grid-cols-5 gap-3 pt-4 border-t border-default">
        {[
          { name: 'Primary', color: primaryColor },
          { name: 'Secondary', color: secondaryColor },
          { name: 'Accent', color: accentColor },
          { name: 'Success', color: successColor },
          { name: 'Text', color: textColor },
        ].map(({ name, color }) => (
          <div key={name} className="text-center">
            <div
              className="w-12 h-12 rounded-lg mx-auto mb-2 shadow-sm border border-default"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-foreground/70">{name}</span>
          </div>
        ))}
      </div>

      {/* Add CSS animation for animated background */}
      {animations.animatedBackground && (
        <style jsx>{`
          @keyframes gradient {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}</style>
      )}
    </div>
  );
}
