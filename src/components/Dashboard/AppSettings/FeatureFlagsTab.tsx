'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, Button, Switch } from '@heroui/react';
import { Spinner } from '@/components/Dashboard/Spinner/Spinner';
import { toast } from 'sonner';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

export function FeatureFlagsTab() {
  const { flags, isLoading, isSaving, updateFeatureFlags } = useFeatureFlags();
  const [localFlags, setLocalFlags] = useState({
    event_tracking_enabled: true,
    bolt_plugin_enabled: true,
    console_plugin_enabled: true,
    logging_enabled: true,
  });

  useEffect(() => {
    if (flags) {
      setLocalFlags(flags);
    }
  }, [flags]);

  const handleSave = async () => {
    const success = await updateFeatureFlags(localFlags);
    if (success) {
      toast.success('Feature flags saved successfully');
    } else {
      toast.error('Failed to save feature flags');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Card className="border border-default hover:border-primary/20 hover:shadow-lg transition-all duration-200">
      <CardBody className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">App Feature Flags</h2>
        <p className="text-sm text-foreground/70 mb-6">
          Control application-level features. These settings override environment variables.
        </p>
        <div className="space-y-6">
          {/* Event Tracking */}
          <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-foreground">Event Tracking</p>
              <p className="text-sm text-foreground/70 mt-1">
                Enable or disable the event tracking system for analytics
              </p>
            </div>
            <Switch
              isSelected={localFlags.event_tracking_enabled}
              onValueChange={(value) =>
                setLocalFlags({ ...localFlags, event_tracking_enabled: value })
              }
            />
          </div>

          {/* Bolt Plugin */}
          <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-foreground">Bolt Metrics Plugin</p>
              <p className="text-sm text-foreground/70 mt-1">
                Enable or disable the Bolt metrics plugin for dashboard integration
              </p>
            </div>
            <Switch
              isSelected={localFlags.bolt_plugin_enabled}
              onValueChange={(value) =>
                setLocalFlags({ ...localFlags, bolt_plugin_enabled: value })
              }
            />
          </div>

          {/* Console Plugin */}
          <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-foreground">Console Plugin</p>
              <p className="text-sm text-foreground/70 mt-1">
                Enable or disable console logging plugin for development debugging
              </p>
            </div>
            <Switch
              isSelected={localFlags.console_plugin_enabled}
              onValueChange={(value) =>
                setLocalFlags({ ...localFlags, console_plugin_enabled: value })
              }
            />
          </div>

          {/* Logging */}
          <div className="flex items-center justify-between p-4 border border-default-200 rounded-lg">
            <div className="flex-1">
              <p className="font-semibold text-foreground">Application Logging</p>
              <p className="text-sm text-foreground/70 mt-1">
                Enable or disable application-wide logging system
              </p>
            </div>
            <Switch
              isSelected={localFlags.logging_enabled}
              onValueChange={(value) =>
                setLocalFlags({ ...localFlags, logging_enabled: value })
              }
            />
          </div>

          <div className="pt-4">
            <Button
              color="primary"
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              onPress={handleSave}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

