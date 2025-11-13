'use client';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
} from '@heroui/react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Buyer } from './BuyerForm';

interface BuyerTableProps {
  buyers: Buyer[];
  onEdit: (buyer: Buyer) => void;
  onDelete: (id: string) => void;
}

export function BuyerTable({ buyers, onEdit, onDelete }: BuyerTableProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'approver':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Table aria-label="Buyers table">
      <TableHeader>
        <TableColumn>NAME</TableColumn>
        <TableColumn>EMAIL</TableColumn>
        <TableColumn>ROLE</TableColumn>
        <TableColumn>COST CENTER</TableColumn>
        <TableColumn>DEPARTMENT</TableColumn>
        <TableColumn>CREDIT LIMIT</TableColumn>
        <TableColumn>ACTIONS</TableColumn>
      </TableHeader>
      <TableBody>
        {buyers.map((buyer) => (
          <TableRow key={buyer.id}>
            <TableCell>
              <p className="font-semibold">{buyer.name}</p>
            </TableCell>
            <TableCell>{buyer.email}</TableCell>
            <TableCell>
              <Chip size="sm" color={getRoleColor(buyer.role)} variant="flat">
                {buyer.role}
              </Chip>
            </TableCell>
            <TableCell>{buyer.costCenter || '-'}</TableCell>
            <TableCell>{buyer.department || '-'}</TableCell>
            <TableCell>
              {buyer.creditLimit
                ? new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(buyer.creditLimit)
                : '-'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => onEdit(buyer)}
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                  color="danger"
                  size="sm"
                  onPress={() => buyer.id && onDelete(buyer.id)}
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

