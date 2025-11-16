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
  Switch,
  Select,
  SelectItem,
} from '@heroui/react';
import { toast } from 'sonner';

export interface ApprovalWorkflow {
  id?: string;
  name: string;
  enabled: boolean;
  minAmount: number;
  maxAmount?: number;
  approvers: string[];
  requiredApprovals: number;
  autoApprove?: boolean;
  conditions?: {
    costCenter?: string[];
    department?: string[];
    projectCode?: string[];
  };
}

interface WorkflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: ApprovalWorkflow) => Promise<void>;
  workflow?: ApprovalWorkflow;
  availableApprovers: Array<{ id: string; name: string; email: string }>;
}

export function WorkflowForm({
  isOpen,
  onClose,
  onSave,
  workflow,
  availableApprovers,
}: WorkflowFormProps) {
  const [formData, setFormData] = useState<ApprovalWorkflow>({
    name: '',
    enabled: true,
    minAmount: 0,
    maxAmount: undefined,
    approvers: [],
    requiredApprovals: 1,
    autoApprove: false,
    conditions: {},
  });
  const [isSaving, setIsSaving] = useState(false);
  const [costCenterInput, setCostCenterInput] = useState('');
  const [departmentInput, setDepartmentInput] = useState('');
  const [projectCodeInput, setProjectCodeInput] = useState('');

  useEffect(() => {
    if (workflow) {
      setFormData(workflow);
      setCostCenterInput(workflow.conditions?.costCenter?.join(', ') || '');
      setDepartmentInput(workflow.conditions?.department?.join(', ') || '');
      setProjectCodeInput(workflow.conditions?.projectCode?.join(', ') || '');
    } else {
      setFormData({
        name: '',
        enabled: true,
        minAmount: 0,
        maxAmount: undefined,
        approvers: [],
        requiredApprovals: 1,
        autoApprove: false,
        conditions: {},
      });
      setCostCenterInput('');
      setDepartmentInput('');
      setProjectCodeInput('');
    }
  }, [workflow, isOpen]);

  const handleSubmit = async () => {
    if (!formData.name || formData.minAmount < 0 || formData.approvers.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.maxAmount && formData.maxAmount <= formData.minAmount) {
      toast.error('Max amount must be greater than min amount');
      return;
    }

    if (formData.requiredApprovals > formData.approvers.length) {
      toast.error('Required approvals cannot exceed number of approvers');
      return;
    }

    setIsSaving(true);
    try {
      const conditions: ApprovalWorkflow['conditions'] = {};
      if (costCenterInput.trim()) {
        conditions.costCenter = costCenterInput.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (departmentInput.trim()) {
        conditions.department = departmentInput.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (projectCodeInput.trim()) {
        conditions.projectCode = projectCodeInput.split(',').map((s) => s.trim()).filter(Boolean);
      }

      await onSave({
        ...formData,
        conditions: Object.keys(conditions).length > 0 ? conditions : undefined,
      });
      onClose();
      toast.success('Workflow saved successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save workflow');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>{workflow ? 'Edit Workflow' : 'Create Workflow'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Name"
              value={formData.name}
              onValueChange={(value) => setFormData({ ...formData, name: value })}
              variant="bordered"
              size="lg"
              isRequired
            />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Enabled</p>
                <p className="text-sm text-foreground/70">Enable this workflow</p>
              </div>
              <Switch
                isSelected={formData.enabled}
                onValueChange={(value) => setFormData({ ...formData, enabled: value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Min Amount"
                value={String(formData.minAmount)}
                onValueChange={(value) =>
                  setFormData({ ...formData, minAmount: parseFloat(value) || 0 })
                }
                variant="bordered"
                size="lg"
                isRequired
              />
              <Input
                type="number"
                label="Max Amount (optional)"
                value={formData.maxAmount ? String(formData.maxAmount) : ''}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    maxAmount: value ? parseFloat(value) : undefined,
                  })
                }
                variant="bordered"
                size="lg"
              />
            </div>

            <Select
              label="Approvers"
              selectedKeys={formData.approvers}
              onSelectionChange={(keys) =>
                setFormData({ ...formData, approvers: Array.from(keys) as string[] })
              }
              variant="bordered"
              size="lg"
              selectionMode="multiple"
              isRequired
            >
              {availableApprovers.map((approver) => (
                <SelectItem key={approver.id}>
                  {approver.name} ({approver.email})
                </SelectItem>
              ))}
            </Select>

            <Input
              type="number"
              label="Required Approvals"
              value={String(formData.requiredApprovals)}
              onValueChange={(value) =>
                setFormData({ ...formData, requiredApprovals: parseInt(value) || 1 })
              }
              variant="bordered"
              size="lg"
              min={1}
              max={formData.approvers.length || 10}
              isRequired
            />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Auto Approve</p>
                <p className="text-sm text-foreground/70">Automatically approve when conditions are met</p>
              </div>
              <Switch
                isSelected={formData.autoApprove}
                onValueChange={(value) => setFormData({ ...formData, autoApprove: value })}
              />
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-foreground">Conditions (optional)</p>
              <Input
                label="Cost Centers (comma-separated)"
                value={costCenterInput}
                onValueChange={setCostCenterInput}
                variant="bordered"
                size="lg"
                placeholder="CC001, CC002"
              />
              <Input
                label="Departments (comma-separated)"
                value={departmentInput}
                onValueChange={setDepartmentInput}
                variant="bordered"
                size="lg"
                placeholder="Sales, Marketing"
              />
              <Input
                label="Project Codes (comma-separated)"
                value={projectCodeInput}
                onValueChange={setProjectCodeInput}
                variant="bordered"
                size="lg"
                placeholder="PROJ001, PROJ002"
              />
            </div>
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

