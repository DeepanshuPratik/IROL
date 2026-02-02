import axios from 'axios';
import { configureIROLClient, createIROLWebSocketClient, logger } from '../index';

// Create an Axios instance
const client = axios.create({
  baseURL: 'http://localhost:3000', // Assuming server is running on 3000
});

// Configure IROL client with request config
const irolConfig = {
  criticality: 'HIGH' as const,
  frequency: 'ALWAYS' as const,
  timeout: 5000,
  retries: 3,
};

// Apply IROL interceptor to add config header to all requests
configureIROLClient(client, irolConfig);

// Example request to get available upgrades
async function getAvailableUpgrades() {
  try {
    const response = await client.get('/api/data');
    console.log('Response data:', response.data);

    // Check the available upgrades header
    const availableUpgrades = response.headers['irol-available-upgrades'];
    if (availableUpgrades) {
      const upgrades = JSON.parse(availableUpgrades);
      console.log('Available upgrades:', upgrades);
      return upgrades;
    }
    return [];
  } catch (error) {
    console.error('Error fetching upgrades:', error);
    return [];
  }
}

// Example long polling request
async function fetchWithLongPolling() {
  try {
    console.log('Fetching data with long polling...');
    const response = await client.get('/api/data');
    console.log('Long polling response data:', response.data);
    console.log('Active upgrade:', response.headers['irol-active-upgrade']);
  } catch (error) {
    console.error('Error with long polling:', error);
  }
}

// Example short polling request (client-side frequent polling)
async function fetchWithShortPolling() {
  console.log('Using short polling (client polls frequently)...');
  for (let i = 0; i < 3; i++) {
    try {
      const response = await client.get('/api/data');
      console.log(`Short poll ${i + 1} response:`, response.data);
      console.log('Active upgrade:', response.headers['irol-active-upgrade']);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    } catch (error) {
      console.error('Error with short polling:', error);
    }
  }
}

// Example WebSocket connection
function connectWithWebSocket() {
  logger.info('Connecting with WebSocket...');
  const ws = createIROLWebSocketClient('ws://localhost:8080', irolConfig, {
    onOpen: () => logger.info('WebSocket opened'),
    onMessage: (data) => {
      logger.info('WebSocket message received:', data);
      // Handle different message types
      if (data.type === 'CONFIG_ACK') {
        logger.info('IROL config acknowledged by server');
      }
    },
    onError: (error) => {
      logger.error('WebSocket error:', error);
    },
    onClose: () => logger.info('WebSocket closed')
  });
}

// Run the example
async function main() {
  const upgrades = await getAvailableUpgrades();

  if (upgrades.includes('websockets')) {
    logger.info('Choosing WebSocket...');
    connectWithWebSocket();
  } else if (upgrades.includes('long-polling')) {
    logger.info('Choosing long polling...');
    configureIROLClient(client, irolConfig, { chosenUpgrade: 'long-polling' });
    await fetchWithLongPolling();
  } else if (upgrades.includes('short-polling')) {
    logger.info('Choosing short polling...');
    configureIROLClient(client, irolConfig, { chosenUpgrade: 'short-polling' });
    await fetchWithShortPolling();
  } else {
    logger.info('Only normal request available.');
  }
}

main();