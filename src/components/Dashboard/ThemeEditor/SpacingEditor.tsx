'use client';

import { Select, SelectItem, Slider } from '@heroui/react';

interface SpacingEditorProps {
  config: {
    cardPadding: 'p-4' | 'p-6' | 'p-8' | 'p-10' | 'p-12';
    gap: 'gap-2' | 'gap-4' | 'gap-6' | 'gap-8' | 'gap-10';
    borderRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';
    containerMaxWidth: string;
  };
  onChange: (key: string, value: string) => void;
}

const cardPaddingOptions = [
  { value: 'p-4', label: 'Small (1rem)' },
  { value: 'p-6', label: 'Medium (1.5rem)' },
  { value: 'p-8', label: 'Large (2rem)' },
  { value: 'p-10', label: 'XL (2.5rem)' },
  { value: 'p-12', label: '2XL (3rem)' },
];

const gapOptions = [
  { value: 'gap-2', label: 'Small (0.5rem)' },
  { value: 'gap-4', label: 'Medium (1rem)' },
  { value: 'gap-6', label: 'Large (1.5rem)' },
  { value: 'gap-8', label: 'XL (2rem)' },
  { value: 'gap-10', label: '2XL (2.5rem)' },
];

const borderRadiusOptions = [
  { value: 'rounded-lg', label: 'Large' },
  { value: 'rounded-xl', label: 'XL' },
  { value: 'rounded-2xl', label: '2XL' },
  { value: 'rounded-3xl', label: '3XL' },
];

const containerOptions = [
  { value: 'max-w-7xl', label: '7XL (1280px)' },
  { value: 'max-w-6xl', label: '6XL (1152px)' },
  { value: 'max-w-5xl', label: '5XL (1024px)' },
  { value: 'max-w-4xl', label: '4XL (896px)' },
  { value: 'max-w-full', label: 'Full Width' },
  { value: 'container-custom', label: 'Custom Container' },
];

export function SpacingEditor({ config, onChange }: SpacingEditorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Card Padding</label>
        <Select
          selectedKeys={[config.cardPadding]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onChange('cardPadding', selected);
          }}
          variant="bordered"
          size="lg"
        >
          {cardPaddingOptions.map((option) => (
            <SelectItem key={option.value} textValue={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Gap Between Elements</label>
        <Select
          selectedKeys={[config.gap]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onChange('gap', selected);
          }}
          variant="bordered"
          size="lg"
        >
          {gapOptions.map((option) => (
            <SelectItem key={option.value} textValue={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Border Radius</label>
        <Select
          selectedKeys={[config.borderRadius]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onChange('borderRadius', selected);
          }}
          variant="bordered"
          size="lg"
        >
          {borderRadiusOptions.map((option) => (
            <SelectItem key={option.value} textValue={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Container Max Width</label>
        <Select
          selectedKeys={[config.containerMaxWidth]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            onChange('containerMaxWidth', selected);
          }}
          variant="bordered"
          size="lg"
        >
          {containerOptions.map((option) => (
            <SelectItem key={option.value} textValue={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}

