import { Request, Response, NextFunction } from 'express'; // Assuming Express, but can be adapted
import { getAvailableUpgrades } from '../core/mapper';
import { IROLRequestConfig } from '../types';
import {
  longPollingHandler,
  shortPollingHandler,
  webSocketHandler,
  normalRequestHandler,
  UpgradeHandlers
} from './upgrades';
import { logger } from '../logger';

import { UpgradeOptions } from './upgrades/types';

export interface IROLServerOptions extends UpgradeOptions {
  headerConfig?: string; // Default: 'IROL-Request-Config'
  headerUpgrades?: string; // Default: 'IROL-Available-Upgrades'
}

/**
 * Creates IROL server middleware.
 * Intercepts requests, parses the config header, determines available upgrades, and sets the upgrades header in the response.
 * If a chosen upgrade is specified, handles the upgrade accordingly.
 */
export function createIROLServerMiddleware(options: IROLServerOptions = {}) {
  const configHeader = options.headerConfig || 'IROL-Request-Config';
  const upgradesHeader = options.headerUpgrades || 'IROL-Available-Upgrades';

  const upgradeHandlers: UpgradeHandlers = {
    'long-polling': longPollingHandler,
    'short-polling': shortPollingHandler,
    'websockets': webSocketHandler,
    'normal-request': normalRequestHandler,
  };

  return (req: Request, res: Response, next: NextFunction) => {
    let config: IROLRequestConfig = {};
    let upgrades: string[] = [];

    try {
      const configHeaderValue = req.get(configHeader);
      if (configHeaderValue) {
        config = JSON.parse(configHeaderValue);
        logger.info('Parsed IROL config', { config, ip: req.ip });
      } else {
        logger.debug('No IROL config header present', { ip: req.ip });
      }
      upgrades = getAvailableUpgrades(config);
      logger.debug('Available upgrades determined', { upgrades, ip: req.ip });
    } catch (error) {
      logger.error('Failed to parse IROL config, using defaults', { error: error instanceof Error ? error.message : String(error), ip: req.ip });
      upgrades = getAvailableUpgrades({});
    }

    // Set available upgrades header
    res.set(upgradesHeader, JSON.stringify(upgrades));

    // Check for chosen upgrade
    const chosenUpgrade = req.get('IROL-Chosen-Upgrade');
    if (chosenUpgrade && upgradeHandlers[chosenUpgrade]) {
      logger.info('Chosen upgrade detected', { chosenUpgrade, ip: req.ip });
      upgradeHandlers[chosenUpgrade](req, res, next, options);
    } else {
      logger.debug('No chosen upgrade or defaulting to normal', { chosenUpgrade, ip: req.ip });
      normalRequestHandler(req, res, next, options);
    }
  };
}