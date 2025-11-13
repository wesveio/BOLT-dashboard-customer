'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { toast } from 'sonner';

export interface CreditLimit {
  id?: string;
  userId: string;
  limit: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface CreditLimitFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (limit: CreditLimit) => Promise<void>;
  limit?: CreditLimit;
  buyers: Array<{ id: string; name: string; email: string }>;
}

export function CreditLimitForm({
  isOpen,
  onClose,
  onSave,
  limit,
  buyers,
}: CreditLimitFormProps) {
  const [formData, setFormData] = useState<CreditLimit>({
    userId: '',
    limit: 0,
    period: 'monthly',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (limit) {
      setFormData(limit);
    } else {
      setFormData({
        userId: '',
        limit: 0,
        period: 'monthly',
      });
    }
  }, [limit, isOpen]);

  const handleSubmit = async () => {
    if (!formData.userId || formData.limit <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
      toast.success('Credit limit saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save credit limit');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{limit ? 'Edit Credit Limit' : 'Create Credit Limit'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="Buyer"
              selectedKeys={formData.userId ? [formData.userId] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData({ ...formData, userId: selected || '' });
              }}
              variant="bordered"
              size="lg"
              isRequired
            >
              {buyers.map((buyer) => (
                <SelectItem key={buyer.id}>
                  {buyer.name} ({buyer.email})
                </SelectItem>
              ))}
            </Select>

            <Input
              type="number"
              label="Credit Limit"
              value={String(formData.limit)}
              onValueChange={(value) =>
                setFormData({ ...formData, limit: parseFloat(value) || 0 })
              }
              variant="bordered"
              size="lg"
              min={0}
              isRequired
            />

            <Select
              label="Period"
              selectedKeys={[formData.period]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as 'daily' | 'weekly' | 'monthly' | 'yearly';
                setFormData({ ...formData, period: selected || 'monthly' });
              }}
              variant="bordered"
              size="lg"
              isRequired
            >
              <SelectItem key="daily">
                Daily
              </SelectItem>
              <SelectItem key="weekly">
                Weekly
              </SelectItem>
              <SelectItem key="monthly">
                Monthly
              </SelectItem>
              <SelectItem key="yearly">
                Yearly
              </SelectItem>
            </Select>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={isSaving}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

