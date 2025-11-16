'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import {
  Card,
  CardBody,
  Button,
  Input,
  Switch,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  buyerId: string;
  amount: number;
  status: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface POConfig {
  prefix: string;
  autoGenerate: boolean;
  requiredFields: string[];
}

export default function PurchaseOrdersPage() {
  const t = useTranslations('dashboard.b2b.purchaseOrders');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [config, setConfig] = useState<POConfig>({
    prefix: 'PO',
    autoGenerate: true,
    requiredFields: ['buyerId', 'amount'],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data, error } = useApi<{
    orders: PurchaseOrder[];
    config: POConfig;
  }>('/api/dashboard/b2b/purchase-orders');

  const { data: buyersData } = useApi<{
    buyers: Array<{ id: string; name: string; email: string }>;
  }>('/api/dashboard/b2b/buyers');

  useEffect(() => {
    if (data) {
      setOrders(data.orders || []);
      if (data.config) {
        setConfig(data.config);
      }
      setIsLoading(false);
    } else if (error) {
      console.error('Error loading purchase orders:', error);
      setIsLoading(false);
    }
  }, [data, error]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/dashboard/b2b/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'config',
          config,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }

      toast.success('Configuration saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const getBuyerName = (buyerId: string) => {
    const buyer = buyersData?.buyers.find((b) => b.id === buyerId);
    return buyer ? `${buyer.name} (${buyer.email})` : buyerId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending_approval':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'default';
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
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <div className="space-y-6">
        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('configuration')}</h2>
            <div className="space-y-4">
              <Input
                label="PO Prefix"
                value={config.prefix}
                onValueChange={(value) => setConfig({ ...config, prefix: value })}
                variant="bordered"
                size="lg"
              />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Auto Generate PO Numbers</p>
                  <p className="text-sm text-gray-600">
                    Automatically generate PO numbers when creating new purchase orders
                  </p>
                </div>
                <Switch
                  isSelected={config.autoGenerate}
                  onValueChange={(value) => setConfig({ ...config, autoGenerate: value })}
                />
              </div>

              <Button
                color="primary"
                onPress={handleSaveConfig}
                isLoading={isSaving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Save Configuration
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('purchaseOrders')}</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No purchase orders found</p>
              </div>
            ) : (
              <Table aria-label="Purchase orders table">
                <TableHeader>
                  <TableColumn>PO NUMBER</TableColumn>
                  <TableColumn>BUYER</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>STATUS</TableColumn>
                  <TableColumn>CREATED</TableColumn>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <p className="font-semibold">{order.poNumber}</p>
                      </TableCell>
                      <TableCell>{getBuyerName(order.buyerId)}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(order.amount)}
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color={getStatusColor(order.status)} variant="flat">
                          {order.status}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </PageWrapper>
  );
}

