import { UpgradeHandler, UpgradeOptions } from './types';
import { logger } from '../../logger';

export const longPollingHandler: UpgradeHandler = (req, res, next, options: UpgradeOptions) => {
  const timeout = options.longPollingTimeout || 10000;

  logger.info('Initiating long polling', { timeout, ip: req.ip, url: req.url });

  // Set header to indicate long polling
  res.set('IROL-Active-Upgrade', 'long-polling');

  // Simulate waiting for data: In production, this would wait for actual data (e.g., database change, event)
  // For demo, use a fixed delay; in tests, it's overridden
  const dataDelay = process.env.NODE_ENV === 'test' ? 500 : Math.random() * timeout;

  const timer = setTimeout(() => {
    if (!res.headersSent) {
      logger.info('Sending long polling data', { delay: dataDelay });
      res.json({
        message: 'Data from long polling',
        timestamp: new Date().toISOString(),
        upgrade: 'long-polling',
        data: { simulated: true, delay: Math.round(dataDelay) }
      });
    }
  }, dataDelay);

  // Handle client disconnect
  req.on('close', () => {
    logger.warn('Long polling request closed by client');
    clearTimeout(timer);
    if (!res.headersSent) {
      res.end();
    }
  });

  // Timeout fallback
  setTimeout(() => {
    if (!res.headersSent) {
      logger.info('Long polling timeout reached, sending no-data response');
      res.json({
        message: 'No data available',
        timestamp: new Date().toISOString(),
        upgrade: 'long-polling',
        data: null
      });
    }
    clearTimeout(timer);
  }, timeout);
};