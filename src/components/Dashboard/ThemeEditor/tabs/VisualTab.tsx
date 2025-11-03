'use client';

import { Card, CardBody, Switch, Select, SelectItem } from '@heroui/react';
import { ColorPicker } from '../ColorPicker';
import { FontSelector } from '../FontSelector';
import { SpacingEditor } from '../SpacingEditor';
import type { ExpandedThemeConfig } from '../types';

interface VisualTabProps {
  config: ExpandedThemeConfig;
  onChange: (config: ExpandedThemeConfig) => void;
}

export function VisualTab({ config, onChange }: VisualTabProps) {
  const updateVisual = (path: string[], value: any) => {
    const newConfig = { ...config };
    let current: any = newConfig.visual;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    onChange(newConfig);
  };

  return (
    <div className="space-y-6">
      {/* Colors */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Colors</h3>
          <div className="space-y-4">
            <ColorPicker
              label="Primary Gradient (From)"
              value={config.visual.colors.primary}
              onChange={(color) => updateVisual(['colors', 'primary'], color)}
              gradient
            />
            <ColorPicker
              label="Secondary Gradient (From)"
              value={config.visual.colors.secondary}
              onChange={(color) => updateVisual(['colors', 'secondary'], color)}
              gradient
            />
            <ColorPicker
              label="Accent Color"
              value={config.visual.colors.accent}
              onChange={(color) => updateVisual(['colors', 'accent'], color)}
            />
            <ColorPicker
              label="Success Color"
              value={config.visual.colors.success}
              onChange={(color) => updateVisual(['colors', 'success'], color)}
            />
            <ColorPicker
              label="Warning Color"
              value={config.visual.colors.warning}
              onChange={(color) => updateVisual(['colors', 'warning'], color)}
            />
            <ColorPicker
              label="Error Color"
              value={config.visual.colors.error}
              onChange={(color) => updateVisual(['colors', 'error'], color)}
            />
            <ColorPicker
              label="Info Color"
              value={config.visual.colors.info}
              onChange={(color) => updateVisual(['colors', 'info'], color)}
            />
            <div className="pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-700 mb-3">Background Colors</h4>
              <div className="space-y-3">
                <ColorPicker
                  label="Primary Background"
                  value={config.visual.colors.background.primary}
                  onChange={(color) => updateVisual(['colors', 'background', 'primary'], color)}
                />
                <ColorPicker
                  label="Secondary Background"
                  value={config.visual.colors.background.secondary}
                  onChange={(color) => updateVisual(['colors', 'background', 'secondary'], color)}
                />
              </div>
            </div>
            <div className="pt-4 border-t">
              <h4 className="text-md font-semibold text-gray-700 mb-3">Text Colors</h4>
              <div className="space-y-3">
                <ColorPicker
                  label="Primary Text"
                  value={config.visual.colors.text.primary}
                  onChange={(color) => updateVisual(['colors', 'text', 'primary'], color)}
                />
                <ColorPicker
                  label="Secondary Text"
                  value={config.visual.colors.text.secondary}
                  onChange={(color) => updateVisual(['colors', 'text', 'secondary'], color)}
                />
                <ColorPicker
                  label="Placeholder Text"
                  value={config.visual.colors.text.placeholder}
                  onChange={(color) => updateVisual(['colors', 'text', 'placeholder'], color)}
                />
              </div>
            </div>
            {config.layout.type === 'liquid-glass' && (
              <div className="pt-4 border-t">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Glassmorphism</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Opacity</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.visual.colors.glassmorphism?.opacity || 0.1}
                      onChange={(e) =>
                        updateVisual(['colors', 'glassmorphism', 'opacity'], parseFloat(e.target.value))
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {config.visual.colors.glassmorphism?.opacity || 0.1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">Blur (px)</label>
                    <input
                      type="range"
                      min="0"
                      max="24"
                      step="2"
                      value={config.visual.colors.glassmorphism?.blur || 12}
                      onChange={(e) =>
                        updateVisual(['colors', 'glassmorphism', 'blur'], parseInt(e.target.value))
                      }
                      className="w-32"
                    />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {config.visual.colors.glassmorphism?.blur || 12}px
                    </span>
                  </div>
                  <ColorPicker
                    label="Border Color"
                    value={config.visual.colors.glassmorphism?.borderColor || 'rgba(255, 255, 255, 0.2)'}
                    onChange={(color) => updateVisual(['colors', 'glassmorphism', 'borderColor'], color)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Typography */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Typography</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-3">Primary Font</h4>
              <FontSelector
                label="Font Family"
                value={config.visual.typography.primary.family}
                onChange={(font) => updateVisual(['typography', 'primary', 'family'], font)}
              />
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-3">Heading Font</h4>
              <FontSelector
                label="Font Family"
                value={config.visual.typography.heading.family}
                onChange={(font) => updateVisual(['typography', 'heading', 'family'], font)}
              />
            </div>
            <div>
              <h4 className="text-md font-semibold text-gray-700 mb-3">Monospace Font</h4>
              <FontSelector
                label="Font Family"
                value={config.visual.typography.mono.family}
                onChange={(font) => updateVisual(['typography', 'mono', 'family'], font)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Spacing */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Spacing & Layout</h3>
          <SpacingEditor
            config={config.visual.spacing}
            onChange={(key, value) => updateVisual(['spacing', key], value)}
          />
        </CardBody>
      </Card>

      {/* Animations */}
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Animations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-gray-700">Animated Background</label>
                <p className="text-xs text-gray-500">Enable animated gradient background</p>
              </div>
              <Switch
                isSelected={config.visual.animations.animatedBackground}
                onValueChange={(value) => updateVisual(['animations', 'animatedBackground'], value)}
                size="sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Transition Duration</label>
              <Select
                selectedKeys={[config.visual.animations.transitionDuration]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateVisual(['animations', 'transitionDuration'], selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="duration-200" textValue="duration-200">Fast (200ms)</SelectItem>
                <SelectItem key="duration-300" textValue="duration-300">Medium (300ms)</SelectItem>
                <SelectItem key="duration-500" textValue="duration-500">Slow (500ms)</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Scroll Behavior</label>
              <Select
                selectedKeys={[config.visual.animations.scrollBehavior]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  updateVisual(['animations', 'scrollBehavior'], selected);
                }}
                variant="bordered"
                size="lg"
              >
                <SelectItem key="smooth" textValue="smooth">Smooth</SelectItem>
                <SelectItem key="auto" textValue="auto">Auto</SelectItem>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

