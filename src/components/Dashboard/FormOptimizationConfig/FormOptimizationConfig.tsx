'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Switch, Button, Select, SelectItem, Chip } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { useApi, useApiPost } from '@/hooks/useApi';
import { Bars3Icon } from '@heroicons/react/24/outline';
import type { FieldPerformance } from '@/hooks/useFormOptimizationMetrics';

interface FormOptimizationConfigProps {
  onSave?: () => void;
  fields?: FieldPerformance[];
}

interface FieldConfig {
  fieldName: string;
  step: string;
  visible: boolean;
  order: number;
  required: boolean;
}

interface FormOptimizationConfigData {
  fieldOrder: Record<string, string[]>;
  fieldVisibility: Record<string, boolean>;
  validationRules: Record<string, any>;
  autoOptimize: boolean;
}

interface FormOptimizationConfigResponse {
  config?: FormOptimizationConfigData;
  optimizations?: Array<{
    id: string;
    config: FormOptimizationConfigData;
    [key: string]: any;
  }>;
  warning?: string;
}

const DEFAULT_FIELDS_BY_STEP: Record<string, string[]> = {
  profile: ['firstName', 'lastName', 'email', 'phone', 'document', 'corporateName', 'tradeName'],
  shipping: ['country', 'postalCode', 'street', 'number', 'complement', 'neighborhood', 'city', 'state'],
  payment: ['cardHolderName', 'cardNumber', 'expirationDate', 'cvv', 'billingAddress'],
};

export function FormOptimizationConfig({ onSave, fields = [] }: FormOptimizationConfigProps) {
  const { data, isLoading, refetch } = useApi<FormOptimizationConfigResponse>(
    '/api/boltx/optimize?type=form_optimization&status=active',
    {
      cacheKey: 'form_optimization_config',
      cacheTTL: 1,
      refetchOnMount: true,
    }
  );

  const { mutate: updateConfig, isLoading: isSaving } = useApiPost<FormOptimizationConfigResponse>();

  const [autoOptimize, setAutoOptimize] = useState(true);
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [selectedStep, setSelectedStep] = useState<string>('profile');

  // Initialize field configs from fields data or defaults
  useEffect(() => {
    if (fields.length > 0) {
      const configs: FieldConfig[] = [];
      const stepFields: Record<string, FieldPerformance[]> = {};

      fields.forEach((field) => {
        if (!stepFields[field.step]) {
          stepFields[field.step] = [];
        }
        stepFields[field.step].push(field);
      });

      Object.entries(stepFields).forEach(([step, stepFieldsList]) => {
        stepFieldsList.forEach((field, index) => {
          configs.push({
            fieldName: field.fieldName,
            step,
            visible: true,
            order: index,
            required: field.completionRate > 0.8,
          });
        });
      });

      setFieldConfigs(configs);
    } else {
      // Use default fields if no field data available
      const configs: FieldConfig[] = [];
      Object.entries(DEFAULT_FIELDS_BY_STEP).forEach(([step, fieldNames]) => {
        fieldNames.forEach((fieldName, index) => {
          configs.push({
            fieldName,
            step,
            visible: true,
            order: index,
            required: index < 3, // First 3 fields are required by default
          });
        });
      });
      setFieldConfigs(configs);
    }
  }, [fields]);

  // Load config from API
  useEffect(() => {
    if (data?.config) {
      setAutoOptimize(data.config.autoOptimize !== false);
      // Apply field order and visibility from config
      if (data.config.fieldOrder || data.config.fieldVisibility) {
        setFieldConfigs((prev) => {
          return prev.map((config) => {
            const stepOrder = data.config?.fieldOrder?.[config.step] || [];
            const order = stepOrder.indexOf(config.fieldName);
            const visible = data.config?.fieldVisibility?.[config.fieldName] !== false;

            return {
              ...config,
              order: order >= 0 ? order : config.order,
              visible,
            };
          });
        });
      }
      setHasChanges(false);
    } else if (data?.optimizations && data.optimizations.length > 0) {
      // If we got optimizations array, try to extract config from the first one
      const firstOpt = data.optimizations[0];
      if (firstOpt?.config) {
        const optConfig = firstOpt.config as FormOptimizationConfigData;
        setAutoOptimize(optConfig.autoOptimize !== false);
        if (optConfig.fieldOrder || optConfig.fieldVisibility) {
          setFieldConfigs((prev) => {
            return prev.map((config) => {
              const stepOrder = optConfig.fieldOrder?.[config.step] || [];
              const order = stepOrder.indexOf(config.fieldName);
              const visible = optConfig.fieldVisibility?.[config.fieldName] !== false;

              return {
                ...config,
                order: order >= 0 ? order : config.order,
                visible,
              };
            });
          });
        }
        setHasChanges(false);
      }
    }
  }, [data]);

  const handleAutoOptimizeChange = (value: boolean) => {
    setAutoOptimize(value);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleFieldVisibilityChange = (fieldName: string, step: string, visible: boolean) => {
    setFieldConfigs((prev) =>
      prev.map((config) =>
        config.fieldName === fieldName && config.step === step
          ? { ...config, visible }
          : config
      )
    );
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleFieldOrderChange = (fieldName: string, step: string, newOrder: number) => {
    const stepConfigs = fieldConfigs.filter((c) => c.step === step).sort((a, b) => a.order - b.order);
    const currentConfig = stepConfigs.find((c) => c.fieldName === fieldName);
    if (!currentConfig) return;

    const oldOrder = currentConfig.order;
    const updatedConfigs = [...fieldConfigs];

    if (newOrder > oldOrder) {
      // Moving down
      stepConfigs.forEach((config) => {
        if (config.order > oldOrder && config.order <= newOrder) {
          const idx = updatedConfigs.findIndex(
            (c) => c.fieldName === config.fieldName && c.step === config.step
          );
          if (idx >= 0) {
            updatedConfigs[idx].order = config.order - 1;
          }
        }
      });
    } else {
      // Moving up
      stepConfigs.forEach((config) => {
        if (config.order >= newOrder && config.order < oldOrder) {
          const idx = updatedConfigs.findIndex(
            (c) => c.fieldName === config.fieldName && c.step === config.step
          );
          if (idx >= 0) {
            updatedConfigs[idx].order = config.order + 1;
          }
        }
      });
    }

    const fieldIdx = updatedConfigs.findIndex(
      (c) => c.fieldName === fieldName && c.step === step
    );
    if (fieldIdx >= 0) {
      updatedConfigs[fieldIdx].order = newOrder;
    }

    setFieldConfigs(updatedConfigs);
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    try {
      // Build config object
      const fieldOrder: Record<string, string[]> = {};
      const fieldVisibility: Record<string, boolean> = {};

      ['profile', 'shipping', 'payment'].forEach((step) => {
        const stepConfigs = fieldConfigs
          .filter((c) => c.step === step)
          .sort((a, b) => a.order - b.order);
        fieldOrder[step] = stepConfigs.map((c) => c.fieldName);
        stepConfigs.forEach((config) => {
          fieldVisibility[config.fieldName] = config.visible;
        });
      });

      const configData: FormOptimizationConfigData = {
        fieldOrder,
        fieldVisibility,
        validationRules: {},
        autoOptimize,
      };

      const result = await updateConfig('/api/boltx/optimize', {
        optimizationType: 'form_optimization',
        name: 'Form Optimization Config',
        description: 'Form field order and visibility configuration',
        config: configData,
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
      console.error('Error saving form optimization config:', error);
      setSaveStatus('error');
    }
  };

  const currentStepFields = fieldConfigs
    .filter((c) => c.step === selectedStep)
    .sort((a, b) => a.order - b.order);

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

  // Show warning if schema cache is refreshing
  const showSchemaWarning = data && 'warning' in data;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <Card className="border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Form Optimization Configuration</h3>
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

          {showSchemaWarning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
              {(data as any).warning || 'Database schema cache is refreshing. Configuration will be available shortly.'}
            </div>
          )}

          <div className="space-y-6">
            {/* Auto-optimize toggle */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Auto-Optimize Fields</h4>
                <p className="text-sm text-gray-600">
                  Automatically optimize field order and visibility based on performance data
                </p>
              </div>
              <Switch
                isSelected={autoOptimize}
                onValueChange={handleAutoOptimizeChange}
                size="sm"
              />
            </div>

            {/* Step selector */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Step</label>
              <Select
                selectedKeys={[selectedStep]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedStep(selected || 'profile');
                }}
                className="w-full"
              >
                <SelectItem key="profile" textValue="profile">
                  Profile
                </SelectItem>
                <SelectItem key="shipping" textValue="shipping">
                  Shipping
                </SelectItem>
                <SelectItem key="payment" textValue="payment">
                  Payment
                </SelectItem>
              </Select>
            </div>

            {/* Field list for selected step */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 mb-2 block">
                Field Order & Visibility ({selectedStep})
              </label>
              {currentStepFields.map((config) => (
                <div
                  key={`${config.step}-${config.fieldName}`}
                  className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Bars3Icon className="w-5 h-5 text-gray-400 rotate-90" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {config.fieldName.charAt(0).toUpperCase() + config.fieldName.slice(1)}
                      </span>
                      {config.required && (
                        <Chip size="sm" color="danger" variant="flat">
                          Required
                        </Chip>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">Order: {config.order + 1}</span>
                  </div>
                  <Switch
                    isSelected={config.visible}
                    onValueChange={(value) =>
                      handleFieldVisibilityChange(config.fieldName, config.step, value)
                    }
                    size="sm"
                  />
                  <Select
                    selectedKeys={[config.order.toString()]}
                    onSelectionChange={(keys) => {
                      const newOrder = parseInt(Array.from(keys)[0] as string);
                      handleFieldOrderChange(config.fieldName, config.step, newOrder);
                    }}
                    className="w-20"
                    size="sm"
                  >
                    {currentStepFields.map((_, idx) => (
                      <SelectItem key={idx.toString()} textValue={idx.toString()}>
                        {idx + 1}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

