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
import { formatDate } from '@/utils/formatters';
import type { InterventionTransformed } from '@/hooks/useInterventionsData';

interface InterventionsTableProps {
  interventions: InterventionTransformed[];
  isLoading?: boolean;
  maxRows?: number;
}

const TYPE_COLORS = {
  discount: 'warning' as const,
  security: 'primary' as const,
  simplify: 'success' as const,
  progress: 'secondary' as const,
};

const RESULT_COLORS = {
  converted: 'success' as const,
  abandoned: 'danger' as const,
  pending: 'default' as const,
};

const RISK_LEVEL_COLORS = {
  low: 'success' as const,
  medium: 'warning' as const,
  high: 'danger' as const,
  critical: 'danger' as const,
};

export function InterventionsTable({ interventions, isLoading = false, maxRows = 100 }: InterventionsTableProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');

  const filteredInterventions = useMemo(() => {
    let filtered = [...interventions];

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((i) => i.type === typeFilter);
    }

    // Filter by status
    if (statusFilter === 'applied') {
      filtered = filtered.filter((i) => i.applied);
    } else if (statusFilter === 'not-applied') {
      filtered = filtered.filter((i) => !i.applied);
    }

    // Filter by result
    if (resultFilter !== 'all') {
      filtered = filtered.filter((i) => i.result === resultFilter);
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Limit rows
    return filtered.slice(0, maxRows);
  }, [interventions, typeFilter, statusFilter, resultFilter, maxRows]);

  const formatSessionId = (sessionId: string): string => {
    return sessionId.length > 12 ? `${sessionId.substring(0, 12)}...` : sessionId;
  };

  const formatType = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading interventions...</div>
      </div>
    );
  }

  if (filteredInterventions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No interventions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select
          label="Type"
          size="sm"
          selectedKeys={[typeFilter]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setTypeFilter(selected || 'all');
          }}
          className="w-40"
        >
          <SelectItem key="all" textValue="all">
            All Types
          </SelectItem>
          <SelectItem key="discount" textValue="discount">
            Discount
          </SelectItem>
          <SelectItem key="security" textValue="security">
            Security
          </SelectItem>
          <SelectItem key="simplify" textValue="simplify">
            Simplify
          </SelectItem>
          <SelectItem key="progress" textValue="progress">
            Progress
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
          <SelectItem key="applied" textValue="applied">
            Applied
          </SelectItem>
          <SelectItem key="not-applied" textValue="not-applied">
            Not Applied
          </SelectItem>
        </Select>

        <Select
          label="Result"
          size="sm"
          selectedKeys={[resultFilter]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setResultFilter(selected || 'all');
          }}
          className="w-40"
        >
          <SelectItem key="all" textValue="all">
            All Results
          </SelectItem>
          <SelectItem key="converted" textValue="converted">
            Converted
          </SelectItem>
          <SelectItem key="abandoned" textValue="abandoned">
            Abandoned
          </SelectItem>
          <SelectItem key="pending" textValue="pending">
            Pending
          </SelectItem>
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="Interventions table" removeWrapper>
        <TableHeader>
          <TableColumn>SESSION ID</TableColumn>
          <TableColumn>TYPE</TableColumn>
          <TableColumn>RISK</TableColumn>
          <TableColumn>STATUS</TableColumn>
          <TableColumn>RESULT</TableColumn>
          <TableColumn>DATE</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No interventions match the filters">
          {filteredInterventions.map((intervention) => (
            <TableRow key={intervention.id}>
              <TableCell>
                <code className="text-xs text-gray-600">{formatSessionId(intervention.sessionId)}</code>
              </TableCell>
              <TableCell>
                <Chip
                  color={TYPE_COLORS[intervention.type]}
                  size="sm"
                  variant="flat"
                  className="capitalize"
                >
                  {formatType(intervention.type)}
                </Chip>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{intervention.riskScore}</span>
                  <Chip
                    color={RISK_LEVEL_COLORS[intervention.riskLevel]}
                    size="sm"
                    variant="flat"
                    className="capitalize"
                  >
                    {intervention.riskLevel}
                  </Chip>
                </div>
              </TableCell>
              <TableCell>
                <Chip
                  color={intervention.applied ? 'success' : 'default'}
                  size="sm"
                  variant="flat"
                >
                  {intervention.applied ? 'Applied' : 'Not Applied'}
                </Chip>
              </TableCell>
              <TableCell>
                {intervention.result ? (
                  <Chip
                    color={RESULT_COLORS[intervention.result]}
                    size="sm"
                    variant="flat"
                    className="capitalize"
                  >
                    {intervention.result}
                  </Chip>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-gray-600">
                  {formatDate(intervention.appliedAt || intervention.createdAt, 'short')}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

