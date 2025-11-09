-- ============================================================================
-- Add BoltX Feature Flags to Configurations
-- ============================================================================
-- Adds individual feature flags for interventions, personalization, and optimizations
-- to the boltx_configurations table

-- Add new columns to boltx_configurations table
ALTER TABLE analytics.boltx_configurations
ADD COLUMN IF NOT EXISTS interventions_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS personalization_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS optimizations_enabled BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN analytics.boltx_configurations.interventions_enabled IS 'Enable/disable BoltX interventions feature';
COMMENT ON COLUMN analytics.boltx_configurations.personalization_enabled IS 'Enable/disable BoltX personalization feature';
COMMENT ON COLUMN analytics.boltx_configurations.optimizations_enabled IS 'Enable/disable BoltX optimizations feature';

