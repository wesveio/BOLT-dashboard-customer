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
} from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { BuyerForm, Buyer } from '@/components/Dashboard/B2B/BuyerForm';
import { BuyerTable } from '@/components/Dashboard/B2B/BuyerTable';
import { useApi } from '@/hooks/useApi';

export default function BuyersPage() {
  const t = useTranslations('dashboard.b2b.buyers');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const { data: buyersData, error: buyersError, refetch: refetchBuyers } = useApi<{
    buyers: Buyer[];
  }>('/api/dashboard/b2b/buyers');

  useEffect(() => {
    if (buyersData?.buyers) {
      setBuyers(buyersData.buyers);
      setIsLoading(false);
    } else if (buyersError) {
      console.error('Error loading buyers:', buyersError);
      setIsLoading(false);
    }
  }, [buyersData, buyersError]);

  const handleCreate = () => {
    setSelectedBuyer(undefined);
    onOpen();
  };

  const handleEdit = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    onOpen();
  };

  const handleSave = async (buyer: Buyer) => {
    try {
      const url = buyer.id
        ? `/api/dashboard/b2b/buyers/${buyer.id}`
        : '/api/dashboard/b2b/buyers';
      const method = buyer.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buyer),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save buyer');
      }

      toast.success('Buyer saved successfully');
      await refetchBuyers();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this buyer?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/b2b/buyers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete buyer');
      }

      toast.success('Buyer deleted successfully');
      await refetchBuyers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete buyer');
    }
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
            {t('createBuyer')}
          </Button>
        }
      />

      <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          {buyers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground/60 mb-4">No buyers configured</p>
              <Button color="primary" onPress={handleCreate}>
                Create First Buyer
              </Button>
            </div>
          ) : (
            <BuyerTable buyers={buyers} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        </CardBody>
      </Card>

      <BuyerForm
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        buyer={selectedBuyer}
      />
    </PageWrapper>
  );
}

