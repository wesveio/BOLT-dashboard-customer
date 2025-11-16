'use client';

import { Input } from '@heroui/react';

interface ColorPickerProps {
  label: string;
  value: string | { from: string; to: string };
  onChange: (color: string | { from: string; to: string }) => void;
  gradient?: boolean;
}

export function ColorPicker({ label, value, onChange, gradient = false }: ColorPickerProps) {
  if (gradient && typeof value === 'object') {
    return (
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground/80">{label}</label>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-default-200 cursor-pointer hover:border-primary transition-colors"
              style={{ background: `linear-gradient(to right, ${value.from}, ${value.to})` }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = value.from;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  onChange({ ...value, from: target.value });
                };
                input.click();
              }}
            />
            <Input
              type="text"
              value={value.from}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              variant="bordered"
              size="sm"
              className="flex-1"
              placeholder="#000000"
              label="From"
              classNames={{
                input: 'text-base font-mono',
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-default-200 cursor-pointer hover:border-primary transition-colors"
              style={{ backgroundColor: value.to }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = value.to;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  onChange({ ...value, to: target.value });
                };
                input.click();
              }}
            />
            <Input
              type="text"
              value={value.to}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              variant="bordered"
              size="sm"
              className="flex-1"
              placeholder="#000000"
              label="To"
              classNames={{
                input: 'text-base font-mono',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const stringValue = typeof value === 'string' ? value : value?.from || '#000000';

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground/80">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg border-2 border-default-200 cursor-pointer hover:border-primary transition-colors"
          style={{ backgroundColor: stringValue }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = stringValue;
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              onChange(target.value);
            };
            input.click();
          }}
        />
        <Input
          type="text"
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          variant="bordered"
          size="sm"
          className="flex-1"
          placeholder="#000000"
          classNames={{
            input: 'text-base font-mono',
          }}
        />
      </div>
    </div>
  );
}

