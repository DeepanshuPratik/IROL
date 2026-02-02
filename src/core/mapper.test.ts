import { getAvailableUpgrades, mergeConfig } from './mapper';
import { IROLRequestConfig } from '../types';

describe('mergeConfig', () => {
  it('should merge with defaults', () => {
    const config: IROLRequestConfig = { criticality: 'HIGH' };
    const merged = mergeConfig(config);
    expect(merged.criticality).toBe('HIGH');
    expect(merged.frequency).toBe('SOMETIMES');
    expect(merged.retries).toBe(0);
    expect(merged.priority).toBe(5);
    expect(merged.features).toEqual([]);
  });
});

describe('getAvailableUpgrades', () => {
  it('should return normal-request and websockets for HIGH criticality and ALWAYS frequency', () => {
    const config: IROLRequestConfig = { criticality: 'HIGH', frequency: 'ALWAYS' };
    const upgrades = getAvailableUpgrades(config);
    expect(upgrades).toEqual(['normal-request', 'websockets']);
  });

  it('should return normal-request, websockets, and long-polling for HIGH criticality', () => {
    const config: IROLRequestConfig = { criticality: 'HIGH' };
    const upgrades = getAvailableUpgrades(config);
    expect(upgrades).toEqual(['normal-request', 'websockets', 'long-polling']);
  });

  it('should return normal-request, websockets, and long-polling for ALWAYS frequency', () => {
    const config: IROLRequestConfig = { frequency: 'ALWAYS' };
    const upgrades = getAvailableUpgrades(config);
    expect(upgrades).toEqual(['normal-request', 'websockets', 'long-polling']);
  });

  it('should return normal-request and short-polling for RARE frequency', () => {
    const config: IROLRequestConfig = { frequency: 'RARE' };
    const upgrades = getAvailableUpgrades(config);
    expect(upgrades).toEqual(['normal-request', 'short-polling']);
  });

  it('should return normal-request, short-polling, and long-polling for default (MEDIUM, SOMETIMES)', () => {
    const config: IROLRequestConfig = {};
    const upgrades = getAvailableUpgrades(config);
    expect(upgrades).toEqual(['normal-request', 'short-polling', 'long-polling']);
  });
});