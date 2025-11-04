'use client';

import { Card, CardBody, Switch, Select, SelectItem } from '@heroui/react';
import type { ExpandedThemeConfig } from '../types';

interface LayoutTabProps {
  config: ExpandedThemeConfig;
  onChange: (config: ExpandedThemeConfig) => void;
}

export function LayoutTab({ config, onChange }: LayoutTabProps) {
  const updateLayout = (path: string[], value: any) => {
    const newConfig = { ...config };
    let current: any = newConfig.layout;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* General Layout */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">General Layout</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Layout Type</label>
              <Select
                selectedKeys={[config.layout.type]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateLayout(['type'], selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="step-by-step" textValue="step-by-step">Step by Step</SelectItem>
                <SelectItem key="single-page" textValue="single-page">Single Page</SelectItem>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Show Stepper</label>
                <p className="text-xs text-gray-500">Display progress stepper</p>
              </div>
              <Switch
                isSelected={config.layout.showStepper}
                onValueChange={(value) => updateLayout(['showStepper'], value)}
                size="sm"
              />
            </div>
            {config.layout.showStepper && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Stepper Position</label>
                <Select
                  selectedKeys={[config.layout.stepperPosition]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    updateLayout(['stepperPosition'], selected);
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="top" textValue="top">Top</SelectItem>
                  <SelectItem key="inline" textValue="inline">Inline</SelectItem>
                  <SelectItem key="hidden" textValue="hidden">Hidden</SelectItem>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Order Summary Position</label>
              <Select
                selectedKeys={[config.layout.orderSummaryPosition]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateLayout(['orderSummaryPosition'], selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="sidebar" textValue="sidebar">Sidebar</SelectItem>
                <SelectItem key="top-sticky" textValue="top-sticky">Top Sticky</SelectItem>
                <SelectItem key="bottom-sticky" textValue="bottom-sticky">Bottom Sticky</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Container Type</label>
              <Select
                selectedKeys={[config.layout.containerType]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateLayout(['containerType'], selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="full-width" textValue="full-width">Full Width</SelectItem>
                <SelectItem key="container-custom" textValue="container-custom">Custom Container</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Components Configuration */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Components</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-gray-700">App Header</h4>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Header</label>
                <Switch
                  isSelected={config.layout.components.appHeader.show}
                  onValueChange={(value) => updateLayout(['components', 'appHeader', 'show'], value)}
                  size="sm"
                />
              </div>
              {config.layout.components.appHeader.show && (
                <>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Sticky Header</label>
                    <Switch
                      isSelected={config.layout.components.appHeader.sticky}
                      onValueChange={(value) => updateLayout(['components', 'appHeader', 'sticky'], value)}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-700">Transparent Header</label>
                    <Switch
                      isSelected={config.layout.components.appHeader.transparent}
                      onValueChange={(value) => updateLayout(['components', 'appHeader', 'transparent'], value)}
                      size="sm"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-700">App Footer</h4>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Footer</label>
                <Switch
                  isSelected={config.layout.components.appFooter.show}
                  onValueChange={(value) => updateLayout(['components', 'appFooter', 'show'], value)}
                  size="sm"
                />
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-700">Modern Stepper</h4>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Style</label>
                <Select
                  selectedKeys={[config.layout.components.modernStepper.style]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    updateLayout(['components', 'modernStepper', 'style'], selected);
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="dots" textValue="dots">Dots</SelectItem>
                  <SelectItem key="lines" textValue="lines">Lines</SelectItem>
                  <SelectItem key="numbers" textValue="numbers">Numbers</SelectItem>
                </Select>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-700">Checkout Header</h4>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Gradient</label>
                <Select
                  selectedKeys={[config.layout.components.checkoutHeader.gradient]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    updateLayout(['components', 'checkoutHeader', 'gradient'], selected);
                  }}
                  variant="bordered"
                  size="lg"
                >
                  <SelectItem key="orange" textValue="orange">Orange</SelectItem>
                  <SelectItem key="blue" textValue="blue">Blue</SelectItem>
                  <SelectItem key="purple" textValue="purple">Purple</SelectItem>
                  <SelectItem key="none" textValue="none">None</SelectItem>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Icons</label>
                <Switch
                  isSelected={config.layout.components.checkoutHeader.showIcons}
                  onValueChange={(value) => updateLayout(['components', 'checkoutHeader', 'showIcons'], value)}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

