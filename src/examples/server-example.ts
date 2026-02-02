import express from 'express';
import WebSocket from 'ws';
import { createIROLServerMiddleware, logger } from '../index';

const app = express();

// Middleware to parse JSON bodies if needed
app.use(express.json());

// Add IROL server middleware to intercept responses and add upgrade headers
app.use(createIROLServerMiddleware());

// Example API endpoint
app.get('/api/data', (req, res) => {
  // Simulate some data
  const data = { message: 'Hello from IROL-enabled server!' };

  // The IROL middleware will automatically add the IROL-Available-Upgrades header based on the request config
  res.json(data);
});

// WebSocket server for IROL WebSocket upgrades
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  logger.info('WebSocket connection established');
  ws.on('message', (message) => {
    logger.debug('WebSocket message received', { message: message.toString() });
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'IROL_CONFIG') {
        logger.info('Received IROL config via WebSocket', { config: data.config });
        ws.send(JSON.stringify({ type: 'CONFIG_ACK', message: 'IROL config received' }));
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message', { error: error instanceof Error ? error.message : String(error) });
    }
  });
  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
});

// Start the HTTP server
const PORT = 3000;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT} with IROL middleware active`);
  logger.info('WebSocket server listening on port 8080');
});