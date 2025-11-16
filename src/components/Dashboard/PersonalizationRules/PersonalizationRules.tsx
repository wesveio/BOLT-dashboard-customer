'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Switch, Input, Select, SelectItem } from '@heroui/react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/utils/animations';
import { useApi, useApiPatch } from '@/hooks/useApi';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';

interface PersonalizationRule {
  id?: string;
  name: string;
  type: 'device' | 'location' | 'behavior' | 'preferences';
  condition: {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in';
    value: string | number | (string | number)[];
  };
  action: {
    layoutVariant?: 'mobile-first' | 'desktop-first';
    fieldOrder?: string[];
    highlightedOptions?: {
      paymentMethods?: string[];
      shippingOptions?: string[];
    };
    messages?: Record<string, string>;
  };
  enabled: boolean;
  priority?: number;
}

interface PersonalizationRulesResponse {
  rules: PersonalizationRule[];
}

export function PersonalizationRules() {
  const { data, isLoading, refetch } = useApi<PersonalizationRulesResponse>(
    '/api/boltx/personalization/rules',
    {
      cacheKey: 'personalization_rules',
      cacheTTL: 1,
      refetchOnMount: true,
    }
  );

  const { mutate: updateRules, isLoading: isUpdating } = useApiPatch<PersonalizationRulesResponse>();

  const [rules, setRules] = useState<PersonalizationRule[]>([]);
  const [, setIsAddingNew] = useState(false);
  const [, setEditingRule] = useState<PersonalizationRule | null>(null);

  useEffect(() => {
    if (data?.rules) {
      setRules(data.rules);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      const result = await updateRules('/api/boltx/personalization/rules', { rules });
      if (result) {
        await refetch();
        setIsAddingNew(false);
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Error saving rules:', error);
    }
  };

  const handleAddNew = () => {
    const newRule: PersonalizationRule = {
      name: 'New Rule',
      type: 'device',
      condition: {
        field: 'deviceType',
        operator: 'equals',
        value: 'mobile',
      },
      action: {},
      enabled: true,
      priority: 50,
    };
    setRules([...rules, newRule]);
    setEditingRule(newRule);
    setIsAddingNew(true);
  };

  const handleRuleChange = (index: number, field: string, value: any) => {
    const updated = [...rules];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setRules(updated);
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardBody className="p-6">
          <div className="h-64 flex flex-col items-center justify-center gap-4">
            <Spinner size="md" />
            <div className="text-gray-500">Loading rules...</div>
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
            <h3 className="text-xl font-bold text-gray-900">Personalization Rules</h3>
            <div className="flex gap-2">
              <Button
                color="primary"
                size="sm"
                onPress={handleAddNew}
              >
                Add Rule
              </Button>
              <Button
                color="primary"
                size="sm"
                variant="flat"
                onPress={handleSave}
                isLoading={isUpdating}
              >
                Save All
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No rules configured. Click "Add Rule" to create one.</p>
              </div>
            ) : (
              rules.map((rule, index) => (
                <div
                  key={rule.id || index}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Input
                        size="sm"
                        value={rule.name}
                        onValueChange={(value) => handleRuleChange(index, 'name', value)}
                        className="w-48"
                      />
                      <Select
                        size="sm"
                        selectedKeys={[rule.type]}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          handleRuleChange(index, 'type', selected);
                        }}
                        className="w-32"
                      >
                        <SelectItem key="device" textValue="device">Device</SelectItem>
                        <SelectItem key="location" textValue="location">Location</SelectItem>
                        <SelectItem key="behavior" textValue="behavior">Behavior</SelectItem>
                        <SelectItem key="preferences" textValue="preferences">Preferences</SelectItem>
                      </Select>
                    </div>
                    <Switch
                      isSelected={rule.enabled}
                      onValueChange={(value) => handleRuleChange(index, 'enabled', value)}
                      size="sm"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Condition:</span> {rule.condition.field} {rule.condition.operator} {Array.isArray(rule.condition.value) ? rule.condition.value.join(', ') : rule.condition.value}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}

