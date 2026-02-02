import { UpgradeHandler, UpgradeOptions } from './types';
import { logger } from '../../logger';

export const shortPollingHandler: UpgradeHandler = (req, res, next, options: UpgradeOptions) => {
  logger.info('Handling short polling request', { ip: req.ip, url: req.url });

  // For short polling, just proceed normally but set a header
  res.set('IROL-Active-Upgrade', 'short-polling');
  // In production, could add caching or optimization for frequent polls
  next();
};