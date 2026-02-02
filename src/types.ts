export type Criticality = 'HIGH' | 'MEDIUM' | 'LOW';

export type Frequency = 'ALWAYS' | 'SOMETIMES' | 'RARE';

export type UpgradeType = 'normal-request' | 'short-polling' | 'long-polling' | 'websockets';

export type ChosenUpgrade = UpgradeType;

export interface IROLRequestConfig {
  criticality?: Criticality;
  frequency?: Frequency;
  timeout?: number;
  retries?: number;
  priority?: number;
  features?: string[];
}

export interface IROLDefaults {
  criticality: Criticality;
  frequency: Frequency;
  timeout?: number;
  retries: number;
  priority: number;
  features: string[];
}

export type MergedConfig = IROLRequestConfig & {
  criticality: Criticality;
  frequency: Frequency;
  retries: number;
  priority: number;
  features: string[];
};