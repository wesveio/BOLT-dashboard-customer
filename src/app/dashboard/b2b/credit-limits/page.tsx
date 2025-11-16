'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import {
  Card,
  CardBody,
  Button,
  useDisclosure,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { CreditLimitForm, CreditLimit } from '@/components/Dashboard/B2B/CreditLimitForm';
import { useApi } from '@/hooks/useApi';

export default function CreditLimitsPage() {
  const t = useTranslations('dashboard.b2b.creditLimits');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [limits, setLimits] = useState<
    Array<CreditLimit & { used?: number; available?: number; resetDate?: string }>
  >([]);
  const [selectedLimit, setSelectedLimit] = useState<CreditLimit | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const { data: limitsData, error: limitsError, refetch: refetchLimits } = useApi<{
    limits: Array<CreditLimit & { used?: number; available?: number; resetDate?: string }>;
  }>('/api/dashboard/b2b/credit-limits');

  const { data: buyersData } = useApi<{
    buyers: Array<{ id: string; name: string; email: string }>;
  }>('/api/dashboard/b2b/buyers');

  useEffect(() => {
    if (limitsData?.limits) {
      setLimits(limitsData.limits);
      setIsLoading(false);
    } else if (limitsError) {
      console.error('Error loading credit limits:', limitsError);
      setIsLoading(false);
    }
  }, [limitsData, limitsError]);

  const handleCreate = () => {
    setSelectedLimit(undefined);
    onOpen();
  };

  const handleEdit = (limit: CreditLimit) => {
    setSelectedLimit(limit);
    onOpen();
  };

  const handleSave = async (limit: CreditLimit) => {
    try {
      const response = await fetch('/api/dashboard/b2b/credit-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limit),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save credit limit');
      }

      toast.success('Credit limit saved successfully');
      await refetchLimits();
    } catch (error) {
      throw error;
    }
  };

  const getBuyerName = (userId: string) => {
    const buyer = buyersData?.buyers.find((b) => b.id === userId);
    return buyer ? `${buyer.name} (${buyer.email})` : userId;
  };

  const getUtilizationColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 90) return 'danger';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          <Button
            color="primary"
            startContent={<PlusIcon className="w-5 h-5" />}
            onPress={handleCreate}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {t('createLimit')}
          </Button>
        }
      />

      <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          {limits.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/60 mb-4">No credit limits configured</p>
              <Button color="primary" onPress={handleCreate}>
                Create First Credit Limit
              </Button>
            </div>
          ) : (
            <Table aria-label="Credit limits table">
              <TableHeader>
                <TableColumn>BUYER</TableColumn>
                <TableColumn>LIMIT</TableColumn>
                <TableColumn>USED</TableColumn>
                <TableColumn>AVAILABLE</TableColumn>
                <TableColumn>PERIOD</TableColumn>
                <TableColumn>UTILIZATION</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {limits.map((limit) => {
                  const used = limit.used || 0;
                  const limitValue = limit.limit;
                  const available = limit.available || limitValue - used;
                  const utilization = (used / limitValue) * 100;

                  return (
                    <TableRow key={limit.id}>
                      <TableCell>{getBuyerName(limit.userId)}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(limitValue)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(used)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(available)}
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {limit.period}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={getUtilizationColor(used, limitValue)}
                          variant="flat"
                        >
                          {utilization.toFixed(1)}%
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="light"
                          size="sm"
                          onPress={() => handleEdit(limit)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <CreditLimitForm
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        limit={selectedLimit}
        buyers={buyersData?.buyers || []}
      />
    </PageWrapper>
  );
}

