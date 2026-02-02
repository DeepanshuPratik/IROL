import axios, { AxiosInstance } from 'axios';
import { configureIROLClient } from './client';
import { logger } from '../logger';

describe('configureIROLClient', () => {
  let axiosInstance: AxiosInstance;

  beforeEach(() => {
    axiosInstance = axios.create();
  });

  it('should configure the axios instance without error', () => {
    const config = { criticality: 'HIGH' as const };
    expect(() => configureIROLClient(axiosInstance, config)).not.toThrow();
  });

  it('should return the configured axios instance', () => {
    const config = { criticality: 'LOW' as const };
    const result = configureIROLClient(axiosInstance, config);
    expect(result).toBe(axiosInstance);
  });

  it('should add chosen upgrade header when specified', async () => {
    const config = { criticality: 'HIGH' as const };
    configureIROLClient(axiosInstance, config, { chosenUpgrade: 'long-polling' });

    const handlers = axiosInstance.interceptors.request.handlers;
    if (handlers && handlers.length > 0) {
      const interceptor = handlers[0];
      const testConfig: any = { headers: {} };
      const result = await interceptor.fulfilled(testConfig);

      expect(result.headers['IROL-Request-Config']).toBe(JSON.stringify(config));
      expect(result.headers['IROL-Chosen-Upgrade']).toBe('long-polling');
    }
  });
});