'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
} from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { formatCurrency } from '@/utils/plans';
import { SubscriptionTransaction } from '@/utils/plans';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
}

interface TransactionDetails extends SubscriptionTransaction {
  gateway_details?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    receiptUrl?: string;
    invoiceUrl?: string;
    metadata?: Record<string, any>;
  };
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  transactionId,
}: TransactionDetailsModalProps) {
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transactionId) {
      fetchTransactionDetails();
    } else {
      setTransaction(null);
      setError(null);
    }
  }, [isOpen, transactionId]);

  const fetchTransactionDetails = async () => {
    if (!transactionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/subscriptions/transactions/${transactionId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch transaction details');
      }

      const data = await response.json();
      setTransaction(data.transaction);
    } catch (err: any) {
      console.error('❌ [DEBUG] Error fetching transaction details:', err);
      setError(err.message || 'Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Transaction Details
        </ModalHeader>
        <ModalBody>
          {isLoading && (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {transaction && !isLoading && (
            <div className="space-y-6">
              {/* Transaction Overview */}
              <Card className="border border-gray-100">
                <CardBody className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </span>
                    </div>
                    <Divider />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Status</span>
                        <p className="font-semibold capitalize">{transaction.status}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Type</span>
                        <p className="font-semibold capitalize">{transaction.transaction_type}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Date</span>
                        <p className="font-semibold">{formatDate(transaction.transaction_date)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Currency</span>
                        <p className="font-semibold">{transaction.currency}</p>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Payment Gateway Information */}
              {transaction.payment_provider && (
                <Card className="border border-gray-100">
                  <CardBody className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Gateway</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Provider</span>
                        <span className="font-semibold capitalize">
                          {transaction.payment_provider}
                        </span>
                      </div>
                      {transaction.payment_intent_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Intent ID</span>
                          <span className="font-mono text-sm">{transaction.payment_intent_id}</span>
                        </div>
                      )}
                      {transaction.gateway_invoice_id && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Invoice ID</span>
                          <span className="font-mono text-sm">
                            {transaction.gateway_invoice_id}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Receipt and Invoice Links */}
              {(transaction.receipt_url || transaction.invoice_url || transaction.gateway_details?.receiptUrl) && (
                <Card className="border border-gray-100">
                  <CardBody className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Documents</h3>
                    <div className="space-y-2">
                      {transaction.receipt_url && (
                        <a
                          href={transaction.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 underline"
                        >
                          View Receipt
                        </a>
                      )}
                      {transaction.invoice_url && (
                        <a
                          href={transaction.invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 underline"
                        >
                          View Invoice
                        </a>
                      )}
                      {transaction.gateway_details?.receiptUrl && (
                        <a
                          href={transaction.gateway_details.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 underline"
                        >
                          View Gateway Receipt
                        </a>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Additional Metadata */}
              {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                <Card className="border border-gray-100">
                  <CardBody className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Additional Information</h3>
                    <div className="space-y-2">
                      {Object.entries(transaction.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-semibold text-right">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

