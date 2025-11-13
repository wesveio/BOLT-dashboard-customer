'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import {
  Card,
  CardBody,
  Button,
  Spinner,
  useDisclosure,
} from '@heroui/react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { WorkflowForm, ApprovalWorkflow } from '@/components/Dashboard/B2B/WorkflowForm';
import { WorkflowTable } from '@/components/Dashboard/B2B/WorkflowTable';
import { useApi } from '@/hooks/useApi';

export default function WorkflowsPage() {
  const t = useTranslations('dashboard.b2b.workflows');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [availableApprovers, setAvailableApprovers] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);

  const { data: workflowsData, error: workflowsError, refetch: refetchWorkflows } = useApi<{
    workflows: ApprovalWorkflow[];
  }>('/api/dashboard/b2b/workflows');

  const { data: buyersData } = useApi<{
    buyers: Array<{ id: string; name: string; email: string; role: string }>;
  }>('/api/dashboard/b2b/buyers');

  useEffect(() => {
    if (workflowsData?.workflows) {
      setWorkflows(workflowsData.workflows);
      setIsLoading(false);
    } else if (workflowsError) {
      console.error('Error loading workflows:', workflowsError);
      setIsLoading(false);
    }
  }, [workflowsData, workflowsError]);

  useEffect(() => {
    if (buyersData?.buyers) {
      const approvers = buyersData.buyers
        .filter((b) => b.role === 'approver' || b.role === 'admin')
        .map((b) => ({ id: b.id, name: b.name, email: b.email }));
      setAvailableApprovers(approvers);
    }
  }, [buyersData]);

  const handleCreate = () => {
    setSelectedWorkflow(undefined);
    onOpen();
  };

  const handleEdit = (workflow: ApprovalWorkflow) => {
    setSelectedWorkflow(workflow);
    onOpen();
  };

  const handleSave = async (workflow: ApprovalWorkflow) => {
    try {
      const url = workflow.id
        ? `/api/dashboard/b2b/workflows/${workflow.id}`
        : '/api/dashboard/b2b/workflows';
      const method = workflow.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workflow');
      }

      await refetchWorkflows();
    } catch (error) {
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard/b2b/workflows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workflow');
      }

      toast.success('Workflow deleted successfully');
      await refetchWorkflows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete workflow');
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/dashboard/b2b/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workflow');
      }

      await refetchWorkflows();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update workflow');
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
            {t('createWorkflow')}
          </Button>
        }
      />

      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          {workflows.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No workflows configured</p>
              <Button color="primary" onPress={handleCreate}>
                Create First Workflow
              </Button>
            </div>
          ) : (
            <WorkflowTable
              workflows={workflows}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          )}
        </CardBody>
      </Card>

      <WorkflowForm
        isOpen={isOpen}
        onClose={onClose}
        onSave={handleSave}
        workflow={selectedWorkflow}
        availableApprovers={availableApprovers}
      />
    </PageWrapper>
  );
}

