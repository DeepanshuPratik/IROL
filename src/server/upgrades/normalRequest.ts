import { UpgradeHandler, UpgradeOptions } from './types';

export const normalRequestHandler: UpgradeHandler = (req, res, next, options: UpgradeOptions) => {
  // No upgrade, proceed normally
  res.set('IROL-Active-Upgrade', 'normal-request');
  next();
};