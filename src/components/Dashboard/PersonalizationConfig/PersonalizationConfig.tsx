'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Switch, Textarea, Button, Slider } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { usePersonalizationConfig, type PersonalizationConfig as PersonalizationConfigType } from '@/hooks/usePersonalizationConfig';

interface PersonalizationConfigProps {
  onSave?: () => void;
}

export function PersonalizationConfig({ onSave }: PersonalizationConfigProps) {
  const { config, isLoading, updateConfig, isSaving } = usePersonalizationConfig();

  const [localConfig, setLocalConfig] = useState<PersonalizationConfigType | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setHasChanges(false);
    }
  }, [config]);

  const handleChange = (field: keyof PersonalizationConfigType, value: any) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      [field]: value,
    });
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleDeviceRuleChange = (device: string, field: string, value: any) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      deviceRules: {
        ...localConfig.deviceRules,
        [device]: {
          ...localConfig.deviceRules?.[device],
          [field]: value,
        },
      },
    });
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleStepMessageChange = (step: string, value: string) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      stepMessages: {
        ...localConfig.stepMessages,
        [step]: value,
      },
    });
    setHasChanges(true);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!localConfig) return;
    try {
      const success = await updateConfig(localConfig);
      if (success) {
        setSaveStatus('success');
        setHasChanges(false);
        if (onSave) {
          onSave();
        }
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving personalization config:', error);
      setSaveStatus('error');
    }
  };

  if (isLoading || !localConfig) {
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
            <h3 className="text-xl font-bold text-gray-900">Personalization Configuration</h3>
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
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">Enable Personalization</h4>
                <p className="text-sm text-gray-600">Turn personalization on or off globally</p>
              </div>
              <Switch
                isSelected={localConfig.enabled}
                onValueChange={(value) => handleChange('enabled', value)}
                size="sm"
              />
            </div>

            {/* Confidence Threshold */}
            {localConfig.enabled && (
              <>
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-900 mb-2 block">
                      Confidence Threshold: {localConfig.confidenceThreshold || 50}%
                    </label>
                    <p className="text-xs text-gray-600 mb-2">
                      Minimum confidence score required to apply personalization
                    </p>
                    <Slider
                      value={localConfig.confidenceThreshold || 50}
                      onChange={(value) => handleChange('confidenceThreshold', Array.isArray(value) ? value[0] : value)}
                      minValue={0}
                      maxValue={100}
                      step={1}
                      className="max-w-md"
                    />
                  </div>
                </div>

                {/* Device Rules */}
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <h4 className="font-semibold text-gray-900">Device Rules</h4>
                  {['mobile', 'desktop', 'tablet'].map((device) => (
                    <div key={device} className="p-3 bg-gray-50 rounded-lg space-y-3">
                      <h5 className="font-medium text-gray-900 capitalize">{device}</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Layout Variant</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            value={localConfig.deviceRules?.[device]?.layoutVariant || 'mobile-first'}
                            onChange={(e) => handleDeviceRuleChange(device, 'layoutVariant', e.target.value)}
                          >
                            <option value="mobile-first">Mobile First</option>
                            <option value="desktop-first">Desktop First</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Step Messages */}
                <div className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <h4 className="font-semibold text-gray-900">Step Messages</h4>
                  {['profile', 'shipping', 'payment'].map((step) => (
                    <Textarea
                      key={step}
                      label={step.charAt(0).toUpperCase() + step.slice(1)}
                      placeholder={`Enter message for ${step} step...`}
                      value={localConfig.stepMessages?.[step] || ''}
                      onValueChange={(value) => handleStepMessageChange(step, value)}
                      minRows={2}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

