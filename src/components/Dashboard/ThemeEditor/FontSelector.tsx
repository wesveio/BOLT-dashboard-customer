'use client';

import { Select, SelectItem } from '@heroui/react';

interface FontSelectorProps {
  label: string;
  value: string;
  onChange: (font: string) => void;
}

const availableFonts = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
];

export function FontSelector({ label, value, onChange }: FontSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground/80">{label}</label>
      <Select
        selectedKeys={[value]}
        onSelectionChange={(keys) => {
          const selected = Array.from(keys)[0] as string;
          onChange(selected);
        }}
        variant="bordered"
        size="lg"
      >
        {availableFonts.map((font) => (
          <SelectItem key={font.value} textValue={font.value}>
            <span style={{ fontFamily: font.value }}>{font.label}</span>
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}

