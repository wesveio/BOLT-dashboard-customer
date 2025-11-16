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
import { formatDuration } from '@/utils/formatters';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';

interface PredictionData {
  sessionId: string;
  prediction: {
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: {
      currentStep: string;
      totalDuration: number;
    };
  };
  isActive: boolean;
  isAbandoned: boolean;
  isCompleted: boolean;
}

interface PredictionsTableProps {
  predictions: PredictionData[];
  isLoading?: boolean;
  maxRows?: number;
}

const RISK_LEVEL_COLORS = {
  low: 'success' as const,
  medium: 'warning' as const,
  high: 'danger' as const,
  critical: 'danger' as const,
};

const STATUS_COLORS = {
  active: 'primary' as const,
  abandoned: 'danger' as const,
  completed: 'success' as const,
};

export function PredictionsTable({ predictions, isLoading = false, maxRows = 50 }: PredictionsTableProps) {
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPredictions = useMemo(() => {
    let filtered = [...predictions];

    // Filter by risk level
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter((p) => p.prediction.riskLevel === riskLevelFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((p) => p.isActive && !p.isCompleted && !p.isAbandoned);
      } else if (statusFilter === 'abandoned') {
        filtered = filtered.filter((p) => p.isAbandoned);
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter((p) => p.isCompleted);
      }
    }

    // Sort by risk score (highest first)
    filtered.sort((a, b) => b.prediction.riskScore - a.prediction.riskScore);

    // Limit rows
    return filtered.slice(0, maxRows);
  }, [predictions, riskLevelFilter, statusFilter, maxRows]);

  const getStatus = (pred: PredictionData): 'active' | 'abandoned' | 'completed' => {
    if (pred.isCompleted) return 'completed';
    if (pred.isAbandoned) return 'abandoned';
    return 'active';
  };

  const formatSessionId = (sessionId: string): string => {
    return sessionId.length > 12 ? `${sessionId.substring(0, 12)}...` : sessionId;
  };

  const formatStep = (step: string): string => {
    return step.charAt(0).toUpperCase() + step.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Spinner size="md" />
        <div className="text-foreground/60">Loading predictions...</div>
      </div>
    );
  }

  if (filteredPredictions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-foreground/60">
        <p>No predictions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select
          label="Risk Level"
          size="sm"
          selectedKeys={[riskLevelFilter]}
          onSelectionChange={(keys) => {
            const selected = Array.from(keys)[0] as string;
            setRiskLevelFilter(selected || 'all');
          }}
          className="w-40"
        >
          <SelectItem key="all" textValue="all">
            All Levels
          </SelectItem>
          <SelectItem key="low" textValue="low">
            Low
          </SelectItem>
          <SelectItem key="medium" textValue="medium">
            Medium
          </SelectItem>
          <SelectItem key="high" textValue="high">
            High
          </SelectItem>
          <SelectItem key="critical" textValue="critical">
            Critical
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
          <SelectItem key="active" textValue="active">
            Active
          </SelectItem>
          <SelectItem key="abandoned" textValue="abandoned">
            Abandoned
          </SelectItem>
          <SelectItem key="completed" textValue="completed">
            Completed
          </SelectItem>
        </Select>
      </div>

      {/* Table */}
      <Table aria-label="Abandonment predictions table" removeWrapper>
        <TableHeader>
          <TableColumn>SESSION ID</TableColumn>
          <TableColumn>RISK SCORE</TableColumn>
          <TableColumn>RISK LEVEL</TableColumn>
          <TableColumn>CURRENT STEP</TableColumn>
          <TableColumn>DURATION</TableColumn>
          <TableColumn>STATUS</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No predictions match the filters">
          {filteredPredictions.map((pred) => {
            const status = getStatus(pred);
            return (
              <TableRow key={pred.sessionId}>
                <TableCell>
                  <code className="text-xs text-foreground/70">{formatSessionId(pred.sessionId)}</code>
                </TableCell>
                <TableCell>
                  <span className="font-semibold text-foreground">{pred.prediction.riskScore}</span>
                </TableCell>
                <TableCell>
                  <Chip
                    color={RISK_LEVEL_COLORS[pred.prediction.riskLevel]}
                    size="sm"
                    variant="flat"
                    className="capitalize"
                  >
                    {pred.prediction.riskLevel}
                  </Chip>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground/70 capitalize">
                    {formatStep(pred.prediction.factors.currentStep || 'unknown')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-foreground/70">
                    {formatDuration(pred.prediction.factors.totalDuration || 0)}
                  </span>
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

