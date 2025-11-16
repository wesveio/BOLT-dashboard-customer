'use client';

import { useState } from 'react';
import { Card, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button } from '@heroui/react';
import { formatCurrency } from '@/utils/plans';
import { Subscription, SubscriptionTransaction } from '@/utils/plans';
import { TransactionDetailsModal } from './TransactionDetailsModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';

interface SubscriptionHistoryProps {
  subscriptions: Subscription[];
  transactions?: SubscriptionTransaction[];
  isLoading?: boolean;
}

export function SubscriptionHistory({ subscriptions, transactions, isLoading }: SubscriptionHistoryProps) {
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const handleTransactionClick = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setIsModalOpen(true);
  };

  const handleCancelClick = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsCancelModalOpen(true);
  };

  const handleCancelSuccess = () => {
    // Refresh the page or refetch subscriptions
    window.location.reload();
  };

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
      <Card className="border border-default">
        <CardBody className="p-6">
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Spinner size="md" />
            <div className="text-foreground/60">Loading subscription history...</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="border border-default">
        <CardBody className="p-6">
          <div className="text-center py-8 text-foreground/60">No subscription history available.</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscriptions Table */}
      <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">Subscription History</h3>
          <Table aria-label="Subscription history">
            <TableHeader>
              <TableColumn>Plan</TableColumn>
              <TableColumn>Status</TableColumn>
              <TableColumn>Billing Cycle</TableColumn>
              <TableColumn>Started</TableColumn>
              <TableColumn>Ended</TableColumn>
              <TableColumn>Actions</TableColumn>
            </TableHeader>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-foreground">{subscription.plan?.name || 'Unknown'}</p>
                      <p className="text-sm text-foreground/60">{subscription.plan?.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip color={getStatusColor(subscription.status)} size="sm" variant="flat">
                      {subscription.status}
                    </Chip>
                    {subscription.status === 'active' && subscription.ended_at && (
                      <p className="text-xs text-warning mt-1">
                        Ends {formatDate(subscription.ended_at)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">{subscription.billing_cycle}</TableCell>
                  <TableCell>{formatDate(subscription.started_at)}</TableCell>
                  <TableCell>{formatDate(subscription.ended_at)}</TableCell>
                  <TableCell>
                    {subscription.status === 'active' && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => handleCancelClick(subscription)}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Transactions Table (if available) */}
      {transactions && transactions.length > 0 && (
        <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">Transaction History</h3>
            <Table aria-label="Transaction history">
              <TableHeader>
                <TableColumn>Date</TableColumn>
                <TableColumn>Type</TableColumn>
                <TableColumn>Amount</TableColumn>
                <TableColumn>Status</TableColumn>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="cursor-pointer hover:bg-default-100 transition-colors"
                    onClick={() => handleTransactionClick(transaction.id)}
                  >
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

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransactionId(null);
        }}
        transactionId={selectedTransactionId}
      />

      {/* Cancel Subscription Modal */}
      {selectedSubscription && (
        <CancelSubscriptionModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setSelectedSubscription(null);
          }}
          subscription={selectedSubscription}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

