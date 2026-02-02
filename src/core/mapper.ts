import { IROLRequestConfig, IROLDefaults, UpgradeType, MergedConfig } from '../types';

const DEFAULTS: IROLDefaults = {
  criticality: 'MEDIUM',
  frequency: 'SOMETIMES',
  retries: 0,
  priority: 5,
  features: [],
};

/**
 * Merges the provided config with defaults.
 */
export function mergeConfig(config: IROLRequestConfig): MergedConfig {
  return {
    criticality: config.criticality || DEFAULTS.criticality,
    frequency: config.frequency || DEFAULTS.frequency,
    timeout: config.timeout,
    retries: config.retries || DEFAULTS.retries,
    priority: config.priority || DEFAULTS.priority,
    features: config.features || DEFAULTS.features,
  };
}

/**
 * Determines available upgrades based on the merged config.
 * 'normal-request' is always available to allow clients to opt out of upgrades.
 * Logic for additional upgrades:
 * - If criticality is HIGH and frequency is ALWAYS: websockets (real-time needed)
 * - If criticality is HIGH: websockets, long-polling
 * - If frequency is ALWAYS: websockets, long-polling
 * - If frequency is RARE: short-polling only
 * - Else: short-polling, long-polling
 */
export function getAvailableUpgrades(config: IROLRequestConfig): UpgradeType[] {
  const merged = mergeConfig(config);
  const { criticality, frequency } = merged;

  let upgrades: UpgradeType[] = ['normal-request'];

  if (criticality === 'HIGH' && frequency === 'ALWAYS') {
    upgrades.push('websockets');
  } else if (criticality === 'HIGH') {
    upgrades.push('websockets', 'long-polling');
  } else if (frequency === 'ALWAYS') {
    upgrades.push('websockets', 'long-polling');
  } else if (frequency === 'RARE') {
    upgrades.push('short-polling');
  } else {
    // Default for MEDIUM criticality and SOMETIMES frequency
    upgrades.push('short-polling', 'long-polling');
  }

  return upgrades;
}