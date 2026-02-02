import { UpgradeHandler, UpgradeOptions } from './types';
import { logger } from '../../logger';

export const webSocketHandler: UpgradeHandler = (req, res, next, options: UpgradeOptions) => {
  logger.info('Handling WebSocket upgrade request', { ip: req.ip, url: req.url });

  // Check if WebSocket upgrade is possible
  const upgradeHeader = req.headers.upgrade;
  const connectionHeader = req.headers.connection;

  if (upgradeHeader !== 'websocket' || !connectionHeader || !connectionHeader.toString().includes('Upgrade')) {
    logger.warn('Invalid WebSocket upgrade request');
    res.status(400).json({ error: 'Invalid WebSocket upgrade' });
    return;
  }

  // WebSocket handshake: Sec-WebSocket-Accept header
  const key = req.headers['sec-websocket-key'];
  if (!key) {
    logger.warn('Missing Sec-WebSocket-Key header');
    res.status(400).json({ error: 'Missing Sec-WebSocket-Key' });
    return;
  }

  const crypto = require('crypto');
  const acceptKey = crypto.createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');

  res.set('Upgrade', 'websocket');
  res.set('Connection', 'Upgrade');
  res.set('Sec-WebSocket-Accept', acceptKey);
  res.set('IROL-Active-Upgrade', 'websockets');

  logger.info('WebSocket upgrade successful');
  res.status(101).end(); // Switching Protocols
};