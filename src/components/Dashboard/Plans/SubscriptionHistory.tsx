'use client';

import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@heroui/react';
import { formatCurrency } from '@/utils/plans';
import { Subscription, SubscriptionTransaction } from '@/utils/plans';

interface SubscriptionHistoryProps {
  subscriptions: Subscription[];
  transactions?: SubscriptionTransaction[];
  isLoading?: boolean;
}

export function SubscriptionHistory({ subscriptions, transactions, isLoading }: SubscriptionHistoryProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'cancelled':
        return 'warning';
      case 'expired':
        return 'danger';
      case 'pending':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <div className="text-center py-8 text-gray-500">Loading subscription history...</div>
        </CardBody>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <div className="text-center py-8 text-gray-500">No subscription history available.</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscriptions Table */}
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Subscription History</h3>
          <Table aria-label="Subscription history">
            <TableHeader>
              <TableColumn>Plan</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Billing Cycle</TableColumn>
              <TableColumn>Started</TableColumn>
              <TableColumn>Ended</TableColumn>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-gray-900">{subscription.plan?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{subscription.plan?.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color={getStatusColor(subscription.status)} size="sm" variant="flat">
                      {subscription.status}
                    </Chip>
                  </TableCell>
                  <TableCell className="capitalize">{subscription.billing_cycle}</TableCell>
                  <TableCell>{formatDate(subscription.started_at)}</TableCell>
                  <TableCell>{formatDate(subscription.ended_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Transactions Table (if available) */}
      {transactions && transactions.length > 0 && (
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Transaction History</h3>
            <Table aria-label="Transaction history">
              <TableHeader>
                <TableColumn>Date</TableColumn>
                <TableColumn>Type</TableColumn>
                <TableColumn>Amount</TableColumn>
                <TableColumn>Status</TableColumn>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                    <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      <Chip color={transaction.status === 'completed' ? 'success' : 'default'} size="sm" variant="flat">
                        {transaction.status}
                      </Chip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

