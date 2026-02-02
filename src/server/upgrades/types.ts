import { Request, Response, NextFunction } from 'express';

export interface UpgradeOptions {
  longPollingTimeout?: number;
  webSocketOptions?: {
    port?: number;
    path?: string;
  };
  // Add more options as needed for other upgrades
}

export interface UpgradeHandler {
  (req: Request, res: Response, next: NextFunction, options: UpgradeOptions): void;
}

export interface UpgradeHandlers {
  [key: string]: UpgradeHandler;
}