import { AxiosInstance } from 'axios';
import WebSocket from 'isomorphic-ws';
import { IROLRequestConfig, ChosenUpgrade } from '../types';

export interface IROLClientOptions {
  headerConfig?: string; // Default: 'IROL-Request-Config'
  chosenUpgrade?: ChosenUpgrade; // The chosen upgrade type
  webSocketUrl?: string; // WebSocket URL for WebSocket upgrade
}

/**
 * Configures the Axios instance with IROL client interceptor.
 * Adds the IROL-Request-Config header to outgoing requests.
 */
export function configureIROLClient(axiosInstance: AxiosInstance, irolConfig: IROLRequestConfig, options: IROLClientOptions = {}) {
  const configHeader = options.headerConfig || 'IROL-Request-Config';

  axiosInstance.interceptors.request.use((requestConfig) => {
    requestConfig.headers = requestConfig.headers || {};
    requestConfig.headers[configHeader] = JSON.stringify(irolConfig);
    logger.debug('Added IROL config to request', { config: irolConfig, url: requestConfig.url });
    if (options.chosenUpgrade) {
      requestConfig.headers['IROL-Chosen-Upgrade'] = options.chosenUpgrade;
      logger.info('Chosen upgrade set', { chosenUpgrade: options.chosenUpgrade, url: requestConfig.url });
    }
    return requestConfig;
  });

  return axiosInstance;
}

import { logger } from '../logger';

/**
 * Creates a WebSocket client for IROL WebSocket upgrades.
 * Sends the IROL config upon connection and handles messages.
 */
export function createIROLWebSocketClient(url: string, irolConfig: IROLRequestConfig, options: { onMessage?: (data: any) => void; onError?: (error: any) => void; onOpen?: () => void; onClose?: () => void } = {}) {
  logger.info('Creating IROL WebSocket client', { url });

  const ws = new WebSocket(url);

  ws.onopen = () => {
    logger.info('WebSocket connection opened');
    // Send IROL config as initial message
    ws.send(JSON.stringify({ type: 'IROL_CONFIG', config: irolConfig }));
    if (options.onOpen) {
      options.onOpen();
    }
  };

  ws.onmessage = (event: WebSocket.MessageEvent) => {
    try {
      const data = JSON.parse(event.data.toString());
      logger.debug('WebSocket message received', { data });
      if (options.onMessage) {
        options.onMessage(data);
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message', { error: error instanceof Error ? error.message : String(error) });
      if (options.onError) {
        options.onError(error);
      }
    }
  };

  ws.onerror = (error: WebSocket.ErrorEvent) => {
    logger.error('WebSocket error', { error });
    if (options.onError) {
      options.onError(error);
    }
  };

  ws.onclose = () => {
    logger.info('WebSocket connection closed');
    if (options.onClose) {
      options.onClose();
    }
  };

  return ws;
}