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

export interface Buyer {
  id?: string;
  email: string;
  name: string;
  role: 'buyer' | 'approver' | 'admin';
  costCenter?: string;
  department?: string;
  projectCode?: string;
  creditLimit?: number;
}

interface BuyerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (buyer: Buyer) => Promise<void>;
  buyer?: Buyer;
}

export function BuyerForm({ isOpen, onClose, onSave, buyer }: BuyerFormProps) {
  const [formData, setFormData] = useState<Buyer>({
    email: '',
    name: '',
    role: 'buyer',
    costCenter: '',
    department: '',
    projectCode: '',
    creditLimit: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (buyer) {
      setFormData(buyer);
    } else {
      setFormData({
        email: '',
        name: '',
        role: 'buyer',
        costCenter: '',
        department: '',
        projectCode: '',
        creditLimit: undefined,
      });
    }
  }, [buyer, isOpen]);

  const handleSubmit = async () => {
    if (!formData.email || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
      toast.success('Buyer saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save buyer');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{buyer ? 'Edit Buyer' : 'Create Buyer'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={formData.email}
              onValueChange={(value) => setFormData({ ...formData, email: value })}
              variant="bordered"
              size="lg"
              isRequired
            />

            <Input
              label="Name"
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              variant="bordered"
              size="lg"
              isRequired
            />

            <Select
              label="Role"
              selectedKeys={[formData.role]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as 'buyer' | 'approver' | 'admin';
                setFormData({ ...formData, role: selected || 'buyer' });
              }}
              variant="bordered"
              size="lg"
              isRequired
            >
              <SelectItem key="buyer">
                Buyer
              </SelectItem>
              <SelectItem key="approver">
                Approver
              </SelectItem>
              <SelectItem key="admin">
                Admin
              </SelectItem>
            </Select>

            <Input
              label="Cost Center"
              value={formData.costCenter || ''}
              onValueChange={(value) => setFormData({ ...formData, costCenter: value })}
              variant="bordered"
              size="lg"
            />

            <Input
              label="Department"
              value={formData.department || ''}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
              variant="bordered"
              size="lg"
            />

            <Input
              label="Project Code"
              value={formData.projectCode || ''}
              onValueChange={(value) => setFormData({ ...formData, projectCode: value })}
              variant="bordered"
              size="lg"
            />

            <Input
              type="number"
              label="Credit Limit (optional)"
              value={formData.creditLimit ? String(formData.creditLimit) : ''}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  creditLimit: value ? parseFloat(value) : undefined,
                })
              }
              variant="bordered"
              size="lg"
              min={0}
            />
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

