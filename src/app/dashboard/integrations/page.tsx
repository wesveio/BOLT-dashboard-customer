'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion as m } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { PageHeader } from '@/components/Dashboard/PageHeader/PageHeader';
import { PageWrapper } from '@/components/Dashboard/PageWrapper/PageWrapper';
import {
  Card,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  useDisclosure,
} from '@heroui/react';
import {
  KeyIcon,
  ClipboardIcon,
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { ApiKeyModal, ApiKeyDisplayModal } from '@/components/Dashboard/ApiKeyModal/ApiKeyModal';
import { maskApiKey } from '@/utils/auth/api-key-generator';
import { formatDate } from '@/utils/formatters';

interface ApiKey {
  id: string;
  account_id: string;
  key_type: 'metrics' | 'custom';
  name?: string;
  description?: string;
  key_prefix: string;
  key_suffix: string;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface VtexCredentials {
  id: string;
  account_id: string;
  app_key: string;
  app_token: string;
  created_at: string;
  updated_at: string;
}

export default function IntegrationsPage() {
  const t = useTranslations('dashboard.integrations');
  const { isAdmin, isOwner } = useRolePermissions();
  const canManageVtex = isAdmin || isOwner;
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [metricsKey, setMetricsKey] = useState<ApiKey | null>(null);
  const [vtexCredentials, setVtexCredentials] = useState<VtexCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSavingVtex, setIsSavingVtex] = useState(false);
  const [isDeletingVtex, setIsDeletingVtex] = useState(false);
  const [vtexFormData, setVtexFormData] = useState({ app_key: '', app_token: '' });
  const [showToken, setShowToken] = useState(false);
  
  const {
    isOpen: isCreateModalOpen,
    onOpen: onCreateModalOpen,
    onClose: onCreateModalClose,
  } = useDisclosure();
  
  const {
    isOpen: isDisplayModalOpen,
    onOpen: onDisplayModalOpen,
    onClose: onDisplayModalClose,
  } = useDisclosure();
  
  const [newApiKey, setNewApiKey] = useState<{ key: string; name?: string } | null>(null);

  // Load API keys and VTEX credentials on mount
  useEffect(() => {
    loadApiKeys();
    loadVtexCredentials();
  }, []);

  const loadApiKeys = async () => {
    try {
      setIsLoading(true);
      
      // Load all API keys
      const [keysResponse, metricsResponse] = await Promise.all([
        fetch('/api/dashboard/integrations'),
        fetch('/api/dashboard/integrations/metrics'),
      ]);

      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        const allKeys = (keysData.apiKeys || []) as ApiKey[];
        
        // Separate metrics and custom keys
        const metrics = allKeys.find((k) => k.key_type === 'metrics') || null;
        const custom = allKeys.filter((k) => k.key_type === 'custom');
        
        setMetricsKey(metrics);
        setApiKeys(custom);
      }

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        if (metricsData.metricsKey) {
          setMetricsKey(metricsData.metricsKey);
        }
      }
    } catch (error) {
      console.error('Load API keys error:', error);
      toast.error(t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKey = async (keyPrefix: string, keySuffix: string) => {
    // For display purposes, we show masked keys, but users can copy the masked format
    const maskedKey = `${keyPrefix}...${keySuffix}`;
    try {
      await navigator.clipboard.writeText(maskedKey);
      toast.success(t('copySuccess'));
    } catch (error) {
      console.error('Copy error:', error);
      toast.error(t('copyError'));
    }
  };

  const handleRegenerateMetrics = async () => {
    if (!isAdmin) {
      toast.error(t('unauthorized'));
      return;
    }

    if (!confirm(t('regenerateConfirm'))) {
      return;
    }

    try {
      setIsRegenerating(true);
      const response = await fetch('/api/dashboard/integrations/metrics', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to regenerate metrics API key');
      }

      const data = await response.json();
      const fullKey = data.metricsKey.key;

      // Show the new key in display modal
      setNewApiKey({ key: fullKey });
      onDisplayModalOpen();

      // Reload keys
      await loadApiKeys();
      
      toast.success(t('regenerated'));
    } catch (error) {
      console.error('Regenerate metrics key error:', error);
      toast.error(t('regenerateError'));
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCreateKey = async (name: string, description?: string) => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/dashboard/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create API key');
      }

      const data = await response.json();
      const fullKey = data.apiKey.key;

      // Show the new key in display modal
      setNewApiKey({ key: fullKey, name });
      onDisplayModalOpen();
      onCreateModalClose();

      // Reload keys
      await loadApiKeys();
      
      toast.success(t('createSuccess'));
    } catch (error) {
      console.error('Create API key error:', error);
      toast.error(t('createError'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!isAdmin) {
      toast.error(t('unauthorized'));
      return;
    }

    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      setDeletingId(keyId);
      const response = await fetch(`/api/dashboard/integrations/${keyId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete API key');
      }

      // Reload keys
      await loadApiKeys();
      
      toast.success(t('deleteSuccess'));
    } catch (error) {
      console.error('Delete API key error:', error);
      toast.error(t('deleteError'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseDisplayModal = () => {
    setNewApiKey(null);
    onDisplayModalClose();
  };

  const loadVtexCredentials = async () => {
    try {
      const response = await fetch('/api/dashboard/integrations/vtex');
      
      if (response.ok) {
        const data = await response.json();
        if (data.credentials) {
          setVtexCredentials(data.credentials);
          setVtexFormData({
            app_key: data.credentials.app_key,
            app_token: data.credentials.app_token,
          });
        } else {
          setVtexCredentials(null);
          setVtexFormData({ app_key: '', app_token: '' });
        }
      }
    } catch (error) {
      console.error('Load VTEX credentials error:', error);
    }
  };

  const handleSaveVtexCredentials = async () => {
    if (!canManageVtex) {
      toast.error(t('vtex.unauthorized'));
      return;
    }

    if (!vtexFormData.app_key.trim() || !vtexFormData.app_token.trim()) {
      toast.error(t('vtex.fieldsRequired'));
      return;
    }

    try {
      setIsSavingVtex(true);
      const response = await fetch('/api/dashboard/integrations/vtex', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_key: vtexFormData.app_key.trim(),
          app_token: vtexFormData.app_token.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save VTEX credentials');
      }

      const data = await response.json();
      if (data.credentials) {
        setVtexCredentials(data.credentials);
        setVtexFormData({
          app_key: data.credentials.app_key,
          app_token: data.credentials.app_token,
        });
      }

      toast.success(t('vtex.saveSuccess'));
    } catch (error) {
      console.error('Save VTEX credentials error:', error);
      toast.error(t('vtex.saveError'));
    } finally {
      setIsSavingVtex(false);
    }
  };

  const handleDeleteVtexCredentials = async () => {
    if (!canManageVtex) {
      toast.error(t('vtex.unauthorized'));
      return;
    }

    if (!confirm(t('vtex.deleteConfirm'))) {
      return;
    }

    try {
      setIsDeletingVtex(true);
      const response = await fetch('/api/dashboard/integrations/vtex', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete VTEX credentials');
      }

      setVtexCredentials(null);
      setVtexFormData({ app_key: '', app_token: '' });
      
      toast.success(t('vtex.deleteSuccess'));
    } catch (error) {
      console.error('Delete VTEX credentials error:', error);
      toast.error(t('vtex.deleteError'));
    } finally {
      setIsDeletingVtex(false);
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          isAdmin && (
            <Button
              color="primary"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={onCreateModalOpen}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              {t('createNew')}
            </Button>
          )
        }
      />

      {/* Metrics API Key Section */}
      <m.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200 mb-8">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <KeyIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('metricsApiKey.title')}</h2>
                  <p className="text-sm text-foreground/70">{t('metricsApiKey.description')}</p>
                </div>
              </div>
              {isAdmin && (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<ArrowPathIcon className="w-5 h-5" />}
                  onPress={handleRegenerateMetrics}
                  isLoading={isRegenerating}
                  className="flex-shrink-0"
                >
                  {t('metricsApiKey.regenerate')}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-foreground/60">Loading...</div>
            ) : metricsKey ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Metrics API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-3 bg-default-50 border border-default-200 rounded-lg font-mono text-sm">
                      {maskApiKey(`${metricsKey.key_prefix}${metricsKey.key_suffix}`.padEnd(32, 'x'))}
                    </div>
                    <Button
                      isIconOnly
                      variant="flat"
                      onPress={() => handleCopyKey(metricsKey.key_prefix, metricsKey.key_suffix)}
                    >
                      <ClipboardIcon className="w-5 h-5 text-foreground/70" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    {t('metricsApiKey.instructions.title')}
                  </h3>
                  <p className="text-sm text-blue-800 mb-2">
                    {t('metricsApiKey.instructions.description')}
                  </p>
                  <code className="block p-2 bg-blue-100 rounded text-xs text-blue-900 mt-2">
                    NEXT_PUBLIC_METRICS_API_KEY=your-key-here
                  </code>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-foreground/60">
                <p className="mb-4">{t('metricsApiKey.noKey')}</p>
                {isAdmin && (
                  <Button
                    color="primary"
                    size="sm"
                    onPress={handleRegenerateMetrics}
                    isLoading={isRegenerating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {t('metricsApiKey.generate')}
                  </Button>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </m.div>

      {/* VTEX Credentials Section */}
      <m.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200 mb-8">
          <CardBody className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Image
                    src="/logos/VTEX-logo.svg"
                    alt="VTEX"
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{t('vtex.title')}</h2>
                  <p className="text-sm text-foreground/70">{t('vtex.description')}</p>
                </div>
              </div>
              {canManageVtex && vtexCredentials && (
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<TrashIcon className="w-5 h-5" />}
                  onPress={handleDeleteVtexCredentials}
                  isLoading={isDeletingVtex}
                  className="flex-shrink-0"
                >
                  {t('vtex.delete')}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-foreground/60">Loading...</div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  <Input
                    type="text"
                    label={t('vtex.appKeyLabel')}
                    placeholder={t('vtex.appKeyPlaceholder')}
                    value={vtexFormData.app_key}
                    onChange={(e) => setVtexFormData({ ...vtexFormData, app_key: e.target.value })}
                    variant="bordered"
                    size="lg"
                    isRequired
                    isDisabled={!canManageVtex}
                    description={t('vtex.appKeyDescription')}
                    classNames={{
                      input: 'text-base font-mono',
                      label: 'text-sm font-semibold',
                    }}
                  />
                  <Input
                    type={showToken ? 'text' : 'password'}
                    label={t('vtex.appTokenLabel')}
                    placeholder={t('vtex.appTokenPlaceholder')}
                    value={vtexFormData.app_token}
                    onChange={(e) => setVtexFormData({ ...vtexFormData, app_token: e.target.value })}
                    variant="bordered"
                    size="lg"
                    isRequired
                    isDisabled={!canManageVtex}
                    description={t('vtex.appTokenDescription')}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="focus:outline-none"
                        aria-label={showToken ? 'Hide token' : 'Show token'}
                      >
                        {showToken ? (
                          <EyeSlashIcon className="w-5 h-5 text-foreground/40 hover:text-foreground/70" />
                        ) : (
                          <EyeIcon className="w-5 h-5 text-foreground/40 hover:text-foreground/70" />
                        )}
                      </button>
                    }
                    classNames={{
                      input: 'text-base font-mono',
                      label: 'text-sm font-semibold',
                    }}
                  />
                </div>

                {canManageVtex && (
                  <div className="flex items-center gap-3">
                    <Button
                      color="primary"
                      onPress={handleSaveVtexCredentials}
                      isLoading={isSavingVtex}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {t('vtex.save')}
                    </Button>
                  </div>
                )}

                {vtexCredentials && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2">
                      {t('vtex.configured.title')}
                    </h3>
                    <p className="text-sm text-green-800">
                      {t('vtex.configured.description')}
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      {t('vtex.configured.lastUpdated')}: {formatDate(vtexCredentials.updated_at)}
                    </p>
                  </div>
                )}

                {!vtexCredentials && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">
                      {t('vtex.instructions.title')}
                    </h3>
                    <p className="text-sm text-blue-800 mb-2">
                      {t('vtex.instructions.description')}
                    </p>
                    <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                      <li>{t('vtex.instructions.step1')}</li>
                      <li>{t('vtex.instructions.step2')}</li>
                      <li>{t('vtex.instructions.step3')}</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </m.div>

      {/* Custom API Keys Section */}
      <m.div variants={fadeIn} initial="hidden" animate="visible">
        <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
          <CardBody className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('customKeys.title')}</h2>
                <p className="text-sm text-foreground/70">{t('customKeys.subtitle')}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-foreground/60">Loading...</div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center">
                <KeyIcon className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
                <p className="text-foreground/70 mb-4">{t('customKeys.noKeys')}</p>
                {isAdmin && (
                  <Button
                    color="primary"
                    startContent={<PlusIcon className="w-5 h-5" />}
                    onPress={onCreateModalOpen}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {t('createNew')}
                  </Button>
                )}
              </div>
            ) : (
              <Table aria-label="API Keys table">
                <TableHeader>
                  <TableColumn>{t('customKeys.table.name')}</TableColumn>
                  <TableColumn>{t('customKeys.table.key')}</TableColumn>
                  <TableColumn>{t('customKeys.table.created')}</TableColumn>
                  <TableColumn>{t('customKeys.table.lastUsed')}</TableColumn>
                  <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-foreground">{key.name}</p>
                          {key.description && (
                            <p className="text-sm text-foreground/70">{key.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-foreground/80">
                            {maskApiKey(`${key.key_prefix}${key.key_suffix}`.padEnd(32, 'x'))}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => handleCopyKey(key.key_prefix, key.key_suffix)}
                          >
                            <ClipboardIcon className="w-4 h-4 text-foreground/70" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground/70">
                          {formatDate(key.created_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground/70">
                          {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {isAdmin && (
                          <Button
                            isIconOnly
                            size="sm"
                            color="danger"
                            variant="light"
                            onPress={() => handleDeleteKey(key.id)}
                            isLoading={deletingId === key.id}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </m.div>

      {/* Create API Key Modal */}
      <ApiKeyModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        onSubmit={handleCreateKey}
        isLoading={isCreating}
      />

      {/* Display New API Key Modal */}
      {newApiKey && (
        <ApiKeyDisplayModal
          isOpen={isDisplayModalOpen}
          onClose={handleCloseDisplayModal}
          apiKey={newApiKey.key}
          keyName={newApiKey.name}
        />
      )}
    </PageWrapper>
  );
}

