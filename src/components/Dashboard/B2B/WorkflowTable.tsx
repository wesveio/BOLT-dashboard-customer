'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Switch,
  Chip,
} from '@heroui/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ApprovalWorkflow } from './WorkflowForm';

interface WorkflowTableProps {
  workflows: ApprovalWorkflow[];
  onEdit: (workflow: ApprovalWorkflow) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

export function WorkflowTable({
  workflows,
  onEdit,
  onDelete,
  onToggle,
}: WorkflowTableProps) {
  return (
    <Table aria-label="Approval workflows table">
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>MIN AMOUNT</TableColumn>
        <TableColumn>MAX AMOUNT</TableColumn>
        <TableColumn>APPROVERS</TableColumn>
        <TableColumn>REQUIRED</TableColumn>
        <TableColumn>STATUS</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {workflows.map((workflow) => (
          <TableRow key={workflow.id}>
            <TableCell>
              <div>
                <p className="font-semibold">{workflow.name}</p>
                {workflow.autoApprove && (
                  <Chip size="sm" color="success" variant="flat">
                    Auto Approve
                  </Chip>
                )}
              </div>
            </TableCell>
            <TableCell>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(workflow.minAmount)}
            </TableCell>
            <TableCell>
              {workflow.maxAmount
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(workflow.maxAmount)
                : 'No limit'}
            </TableCell>
            <TableCell>{workflow.approvers.length}</TableCell>
            <TableCell>{workflow.requiredApprovals}</TableCell>
            <TableCell>
              <Switch
                isSelected={workflow.enabled}
                onValueChange={(value) => workflow.id && onToggle(workflow.id, value)}
                size="sm"
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => onEdit(workflow)}
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  size="sm"
                  onPress={() => workflow.id && onDelete(workflow.id)}
                >
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

