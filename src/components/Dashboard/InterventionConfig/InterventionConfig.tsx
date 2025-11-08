'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Switch, Input, Textarea, Button, Slider } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { useApi, useApiPatch } from '@/hooks/useApi';

interface InterventionConfigProps {
  onSave?: () => void;
}

interface InterventionConfigData {
  type: 'discount' | 'security' | 'simplify' | 'progress';
  enabled: boolean;
  threshold: number;
  message?: string;
  discount?: {
    percentage?: number;
    amount?: number;
    code?: string;
  };
}

interface InterventionsConfigResponse {
  interventions: InterventionConfigData[];
}

export function InterventionConfig({ onSave }: InterventionConfigProps) {
  const { data, isLoading, refetch } = useApi<InterventionsConfigResponse>(
    '/api/boltx/interventions/config',
    {
      cacheKey: 'intervention_config',
      cacheTTL: 1,
      refetchOnMount: true,
    }
  );

  const { mutate: updateConfig, isLoading: isSaving } = useApiPatch<InterventionsConfigResponse>();

  const [configs, setConfigs] = useState<InterventionConfigData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (data?.interventions) {
      setConfigs(data.interventions);
      setHasChanges(false);
    }
  }, [data]);

  const handleConfigChange = (index: number, field: string, value: any) => {
    const updated = [...configs];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setConfigs(updated);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleDiscountChange = (index: number, field: string, value: any) => {
    const updated = [...configs];
    updated[index] = {
      ...updated[index],
      discount: {
        ...updated[index].discount,
        [field]: value,
      },
    };
    setConfigs(updated);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    try {
      const result = await updateConfig('/api/boltx/interventions/config', {
        interventions: configs,
      });

      if (result) {
        setSaveStatus('success');
        setHasChanges(false);
        await refetch();
        if (onSave) {
          onSave();
        }
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving intervention config:', error);
      setSaveStatus('error');
    }
  };

  const getTypeLabel = (type: string): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading configuration...</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Intervention Configuration</h3>
            {hasChanges && (
              <Button
                color="primary"
                size="sm"
                onPress={handleSave}
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            )}
          </div>

          {saveStatus === 'success' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              Configuration saved successfully
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Failed to save configuration. Please try again.
            </div>
          )}

          <div className="space-y-6">
            {configs.map((config, index) => (
              <div
                key={config.type}
                className="p-4 border border-gray-200 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">{getTypeLabel(config.type)}</h4>
                  <Switch
                    isSelected={config.enabled}
                    onValueChange={(value) => handleConfigChange(index, 'enabled', value)}
                    size="sm"
                  />
                </div>

                {config.enabled && (
                  <>
                    <div>
                      <label className="text-sm text-gray-600 mb-2 block">
                        Risk Threshold: {config.threshold}
                      </label>
                      <Slider
                        value={config.threshold}
                        onChange={(value) => handleConfigChange(index, 'threshold', Array.isArray(value) ? value[0] : value)}
                        minValue={0}
                        maxValue={100}
                        step={1}
                        className="max-w-md"
                      />
                    </div>

                    <Textarea
                      label="Message"
                      placeholder="Enter intervention message..."
                      value={config.message || ''}
                      onValueChange={(value) => handleConfigChange(index, 'message', value)}
                      minRows={2}
                    />

                    {config.type === 'discount' && (
                      <div className="space-y-3 pt-2 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Discount Percentage"
                            type="number"
                            min={0}
                            max={100}
                            value={config.discount?.percentage?.toString() || ''}
                            onValueChange={(value) =>
                              handleDiscountChange(index, 'percentage', value ? parseFloat(value) : undefined)
                            }
                            endContent={<span className="text-gray-500">%</span>}
                          />
                          <Input
                            label="Discount Amount"
                            type="number"
                            min={0}
                            value={config.discount?.amount?.toString() || ''}
                            onValueChange={(value) =>
                              handleDiscountChange(index, 'amount', value ? parseFloat(value) : undefined)
                            }
                            startContent={<span className="text-gray-500">$</span>}
                          />
                        </div>
                        <Input
                          label="Discount Code (Optional)"
                          placeholder="SAVE10"
                          value={config.discount?.code || ''}
                          onValueChange={(value) => handleDiscountChange(index, 'code', value || undefined)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

