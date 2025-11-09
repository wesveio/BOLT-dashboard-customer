'use client';

import { useMemo, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
} from '@heroui/react';
import { formatPercentage } from '@/utils/formatters';
import type { FieldPerformance } from '@/hooks/useFormOptimizationMetrics';

interface FieldsPerformanceTableProps {
  fields: FieldPerformance[];
  isLoading?: boolean;
  maxRows?: number;
}

const STEP_COLORS: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  profile: 'primary',
  shipping: 'secondary',
  payment: 'success',
};

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  excellent: 'success',
  good: 'success',
  fair: 'warning',
  poor: 'danger',
};

function getStatus(completionRate: number, errorRate: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (completionRate >= 0.9 && errorRate < 0.1) return 'excellent';
  if (completionRate >= 0.7 && errorRate < 0.2) return 'good';
  if (completionRate >= 0.5 && errorRate < 0.3) return 'fair';
  return 'poor';
}

export function FieldsPerformanceTable({ fields, isLoading = false, maxRows = 100 }: FieldsPerformanceTableProps) {
  const [stepFilter, setStepFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'completionRate' | 'errorRate' | 'avgTime' | 'fieldName'>('completionRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredAndSortedFields = useMemo(() => {
    let filtered = [...fields];

    // Filter by step
    if (stepFilter !== 'all') {
      filtered = filtered.filter((f) => f.step === stepFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((f) => {
        const status = getStatus(f.completionRate, f.errorRate);
        return status === statusFilter;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'completionRate':
          comparison = a.completionRate - b.completionRate;
          break;
        case 'errorRate':
          comparison = a.errorRate - b.errorRate;
          break;
        case 'avgTime':
          comparison = a.avgTimeToComplete - b.avgTimeToComplete;
          break;
        case 'fieldName':
          comparison = a.fieldName.localeCompare(b.fieldName);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Limit rows
    return filtered.slice(0, maxRows);
  }, [fields, stepFilter, statusFilter, sortBy, sortOrder, maxRows]);

  const formatFieldName = (name: string): string => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatStep = (step: string): string => {
    return step.charAt(0).toUpperCase() + step.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading field performance data...</div>
      </div>
    );
  }

  if (filteredAndSortedFields.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Select
            label="Step"
            size="sm"
            selectedKeys={[stepFilter]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setStepFilter(selected || 'all');
            }}
            className="w-40"
          >
            <SelectItem key="all" textValue="all">
              All Steps
            </SelectItem>
            <SelectItem key="profile" textValue="profile">
              Profile
            </SelectItem>
            <SelectItem key="shipping" textValue="shipping">
              Shipping
            </SelectItem>
            <SelectItem key="payment" textValue="payment">
              Payment
            </SelectItem>
          </Select>

          <Select
            label="Status"
            size="sm"
            selectedKeys={[statusFilter]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0] as string;
              setStatusFilter(selected || 'all');
            }}
            className="w-40"
          >
            <SelectItem key="all" textValue="all">
              All Status
            </SelectItem>
            <SelectItem key="excellent" textValue="excellent">
              Excellent
            </SelectItem>
            <SelectItem key="good" textValue="good">
              Good
            </SelectItem>
            <SelectItem key="fair" textValue="fair">
              Fair
            </SelectItem>
            <SelectItem key="poor" textValue="poor">
              Poor
            </SelectItem>
          </Select>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>No field performance data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select
          label="Step"
          size="sm"
          selectedKeys={[stepFilter]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setStepFilter(selected || 'all');
          }}
          className="w-40"
        >
          <SelectItem key="all" textValue="all">
            All Steps
          </SelectItem>
          <SelectItem key="profile" textValue="profile">
            Profile
          </SelectItem>
          <SelectItem key="shipping" textValue="shipping">
            Shipping
          </SelectItem>
          <SelectItem key="payment" textValue="payment">
            Payment
          </SelectItem>
        </Select>

        <Select
          label="Status"
          size="sm"
          selectedKeys={[statusFilter]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setStatusFilter(selected || 'all');
          }}
          className="w-40"
        >
          <SelectItem key="all" textValue="all">
            All Status
          </SelectItem>
          <SelectItem key="excellent" textValue="excellent">
            Excellent
          </SelectItem>
          <SelectItem key="good" textValue="good">
            Good
          </SelectItem>
          <SelectItem key="fair" textValue="fair">
            Fair
          </SelectItem>
          <SelectItem key="poor" textValue="poor">
            Poor
          </SelectItem>
        </Select>

        <Select
          label="Sort By"
          size="sm"
          selectedKeys={[sortBy]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setSortBy(selected as typeof sortBy);
          }}
          className="w-48"
        >
          <SelectItem key="completionRate" textValue="completionRate">
            Completion Rate
          </SelectItem>
          <SelectItem key="errorRate" textValue="errorRate">
            Error Rate
          </SelectItem>
          <SelectItem key="avgTime" textValue="avgTime">
            Avg Time
          </SelectItem>
          <SelectItem key="fieldName" textValue="fieldName">
            Field Name
          </SelectItem>
        </Select>

        <Select
          label="Order"
          size="sm"
          selectedKeys={[sortOrder]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setSortOrder(selected as 'asc' | 'desc');
          }}
          className="w-32"
        >
          <SelectItem key="desc" textValue="desc">
            Descending
          </SelectItem>
          <SelectItem key="asc" textValue="asc">
            Ascending
          </SelectItem>
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="Field performance table" removeWrapper>
        <TableHeader>
          <TableColumn>FIELD NAME</TableColumn>
          <TableColumn>STEP</TableColumn>
          <TableColumn>COMPLETION RATE</TableColumn>
          <TableColumn>ERROR RATE</TableColumn>
          <TableColumn>AVG TIME</TableColumn>
          <TableColumn>ATTEMPTS</TableColumn>
          <TableColumn>STATUS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No fields match the filters">
          {filteredAndSortedFields.map((field, index) => {
            const status = getStatus(field.completionRate, field.errorRate);
            return (
              <TableRow key={`${field.step}-${field.fieldName}-${index}`}>
                <TableCell>
                  <span className="font-semibold text-gray-900">{formatFieldName(field.fieldName)}</span>
                </TableCell>
                <TableCell>
                  <Chip
                    color={STEP_COLORS[field.step] || 'default'}
                    size="sm"
                    variant="flat"
                    className="capitalize"
                  >
                    {formatStep(field.step)}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900 font-medium">
                    {formatPercentage(field.completionRate * 100)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-900 font-medium">
                    {formatPercentage(field.errorRate * 100)}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {(field.avgTimeToComplete / 1000).toFixed(2)}s
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{field.totalAttempts}</span>
                </TableCell>
                <TableCell>
                  <Chip
                    color={STATUS_COLORS[status]}
                    size="sm"
                    variant="flat"
                    className="capitalize"
                  >
                    {status}
                  </Chip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

