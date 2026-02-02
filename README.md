# IROL (Intelligent Request Orchestration Layer)

## Project Goal

IROL is designed as an Intelligent Request Orchestration Layer to facilitate smart, adaptive communication between clients and servers in distributed systems. It introduces a middleware-based approach where servers act as providers by injecting metadata into HTTP responses, such as available communication upgrades (e.g., short-polling, long-polling, WebSockets), while clients as receivers can specify request-level configurations in headers. Based on the client's config (e.g., criticality, frequency), the server suggests suitable upgrades, enabling dynamic negotiation of communication methods. The client can then choose to upgrade its request handling accordingly, all managed seamlessly between IROL's client and server layers without disturbing the core application codebase. This allows for intelligent orchestration like protocol switching, load balancing, or adaptive polling without altering existing logic. The layer aims to be lightweight, easy to integrate like standard middleware, and extensible for various orchestration strategies.

## Project Plan

### Overall Architecture

IROL will be implemented as a TypeScript library/package that provides:

- **Server Middleware**: Integrates into server frameworks (e.g., Express.js, Fastify) to intercept responses and inject orchestration headers.
- **Client Interceptor**: Hooks into client-side HTTP libraries (e.g., Axios, Fetch) to append configuration headers before sending requests.

The library will be modular, with separate exports for server and client roles, ensuring easy integration.

### Header Fields

The following custom headers will be used for communication:

- **`IROL-Available-Upgrades`**: A JSON-encoded array of strings representing available communication upgrade options suggested by the server based on the client's request config. These could include methods like short-polling, long-polling, WebSockets, etc. The server determines these dynamically to enable adaptive protocol negotiation. Example: `["normal-request", "short-polling", "long-polling", "websockets"]`. The client can then choose to upgrade its request handling accordingly.
- **`IROL-Request-Config`**: A JSON-encoded object specifying client-side request configurations. This header is set by the client interceptor and read by the server middleware to decide on available upgrades and other orchestration logic.
- **`IROL-Chosen-Upgrade`** (optional): A string indicating the upgrade chosen by the client. If set, the server will attempt to handle the request using the chosen upgrade method (e.g., long polling). Example: `"long-polling"`.
- **`IROL-Active-Upgrade`** (response): Indicates which upgrade method is currently active for the response. Set by the server when handling a chosen upgrade.

## Project Structure

```
src/
├── types.ts              # Type definitions and interfaces
├── core/
│   ├── mapper.ts         # Logic for determining available upgrades
│   └── mapper.test.ts    # Tests for mapper
├── server/
│   ├── server.ts         # Server middleware for Express-like frameworks
│   ├── server.test.ts    # Tests for server middleware
│   └── upgrades/         # Modular upgrade handlers
│       ├── index.ts      # Exports for upgrade handlers
│       ├── types.ts      # Upgrade handler interfaces
│       ├── longPolling.ts # Long polling implementation
│       ├── shortPolling.ts # Short polling implementation
│       ├── webSocket.ts  # WebSocket upgrade (placeholder)
│       └── normalRequest.ts # Normal request handling
├── client/
│   ├── client.ts         # Client interceptor for Axios
│   └── client.test.ts    # Tests for client interceptor
├── examples/
│   ├── server-example.ts # Example server setup with IROL
│   └── client-example.ts # Example client usage with IROL
└── index.ts              # Main exports
```

## Client vs Server Responsibilities

The implementation of upgrade features is split between client and server based on the nature of the upgrade:

### Server-Side
- **Long Polling**: Server holds the HTTP connection open until data is available or timeout.
- **WebSocket Upgrade**: Server initiates the protocol upgrade to WebSocket.
- **Short Polling**: Server responds normally; client handles frequent polling.
- **Normal Request**: Standard HTTP response handling.

### Client-Side
- **Long Polling**: Client waits for the server's held response.
- **Short Polling**: Client implements frequent HTTP requests.
- **WebSocket**: Client establishes and manages the WebSocket connection using a WebSocket library.
- **Normal Request**: Standard HTTP client behavior.

This separation ensures the server provides upgrade capabilities while clients choose and implement the communication method.

## Local Testing Guide

Test IROL features locally with proper logging to validate functionality.

### Testing Long Polling

1. **Start the Server:**
   ```bash
   cd /path/to/your/project
   npm run build
   node dist/examples/server-example.js
   ```
   You should see logs like:
   ```
   info: Server started on port 3000 with IROL middleware active
   ```

2. **Run the Client:**
   ```bash
   node dist/examples/client-example.js
   ```
   Expected logs:
   ```
   info: Available upgrades ["normal-request","websockets","long-polling"]
   info: Choosing long polling...
   info: Long polling response data: { message: 'Data from long polling', ... }
   ```
   Server logs:
   ```
   info: Parsed IROL config { config: { criticality: 'HIGH', ... }, ip: '127.0.0.1' }
   info: Chosen upgrade detected { chosenUpgrade: 'long-polling', ip: '127.0.0.1' }
   info: Initiating long polling { timeout: 10000, ip: '127.0.0.1' }
   info: Sending long polling data { delay: 500 }
   ```

### Testing WebSockets

1. **Update Server Example** to include WebSocket server (as shown in usage).

2. **Run Server:**
   ```
   info: Server started on port 3000 with IROL middleware active
   info: WebSocket server listening on port 8080
   ```

3. **Run Client** (modify client-example to choose WebSocket):
   Client logs:
   ```
   info: Available upgrades ["normal-request","websockets","long-polling"]
   info: Choosing WebSocket upgrade
   info: Creating IROL WebSocket client { url: 'ws://localhost:8080' }
   info: WebSocket connection opened
   ```

   Server logs:
   ```
   info: Handling WebSocket upgrade request { ip: '127.0.0.1' }
   info: WebSocket upgrade successful
   info: WebSocket connection established
   ```

### Debugging Tips

- **Enable Debug Logs:** Set `LOG_LEVEL=debug` environment variable.
- **Monitor Headers:** Use browser dev tools or curl to inspect `IROL-Available-Upgrades` and `IROL-Active-Upgrade` headers.
- **Test Edge Cases:** Try invalid configs, missing headers, or client disconnects during long polling.
- **Curl Examples:**
  ```bash
  # Normal request
  curl -H "IROL-Request-Config: {\"criticality\":\"HIGH\"}" http://localhost:3000/api/data

  # Long polling
  curl -H "IROL-Request-Config: {\"criticality\":\"HIGH\"}" -H "IROL-Chosen-Upgrade: long-polling" http://localhost:3000/api/data
  ```

## Production Readiness

IROL is designed for enterprise deployment with:
- **Scalable Architecture**: Modular upgrade handlers allow easy addition of new communication methods.
- **Comprehensive Logging**: Integrated Winston logger for monitoring and debugging.
- **Robust Error Handling**: Graceful fallbacks and client disconnect handling.
- **Security**: Proper WebSocket handshake validation.
- **Testing**: Extensive test coverage with logging validation.

## Usage

### Server-Side Setup (TypeScript)

Integrate IROL middleware into your Express application to enable intelligent request orchestration.

```typescript
import express from 'express';
import { createIROLServerMiddleware, logger } from 'irol';

const app = express();
app.use(express.json());

// Configure IROL middleware with options
const irolOptions = {
  longPollingTimeout: 15000,  // 15 seconds for long polling
  webSocketOptions: {
    port: 3000,
    path: '/ws'
  }
};
app.use(createIROLServerMiddleware(irolOptions));

// Your API routes
app.get('/api/data', (req, res) => {
  logger.info('Processing data request', { endpoint: '/api/data' });
  // Simulate data processing
  const data = { message: 'Hello from IROL-enabled server!', timestamp: new Date() };
  res.json(data);
});

// For WebSocket support, you can integrate with ws library
import WebSocket from 'ws';
const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', (ws) => {
  logger.info('WebSocket connection established');
  ws.on('message', (message) => {
    logger.debug('WebSocket message received', { message: message.toString() });
    // Handle IROL messages
  });
});

app.listen(3000, () => {
  logger.info('Server started on port 3000 with IROL middleware active');
});
```

**Key Points:**
- Middleware automatically adds `IROL-Available-Upgrades` header to responses.
- Handles chosen upgrades (e.g., long polling holds connection, WebSocket upgrades protocol).
- Logs all activities for monitoring.

### Client-Side Setup (TypeScript)

Configure your HTTP client and optionally use WebSocket for real-time communication.

```typescript
import axios, { AxiosResponse } from 'axios';
import { configureIROLClient, createIROLWebSocketClient, logger } from 'irol';

// Create and configure HTTP client
const client = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000
});

// Define IROL configuration
const irolConfig = {
  criticality: 'HIGH' as const,
  frequency: 'ALWAYS' as const,
  timeout: 5000
};

// Initial configuration without chosen upgrade
configureIROLClient(client, irolConfig);

// Function to handle responses and choose upgrades
async function handleResponse(response: AxiosResponse) {
  logger.info('Received response', { status: response.status, url: response.config.url });

  const upgradesHeader = response.headers['irol-available-upgrades'];
  if (upgradesHeader) {
    const availableUpgrades = JSON.parse(upgradesHeader);
    logger.info('Available upgrades', { availableUpgrades });

    // Choose upgrade based on needs
    if (availableUpgrades.includes('websockets')) {
      logger.info('Choosing WebSocket upgrade');
      const ws = createIROLWebSocketClient('ws://localhost:8080', irolConfig, {
        onOpen: () => logger.info('WebSocket connected'),
        onMessage: (data) => {
          logger.info('WebSocket message', { data });
          // Handle real-time data
        },
        onError: (error) => logger.error('WebSocket error', { error }),
        onClose: () => logger.info('WebSocket closed')
      });
      // Use ws for further communication
    } else if (availableUpgrades.includes('long-polling')) {
      logger.info('Choosing long polling');
      // Reconfigure client for long polling
      configureIROLClient(client, irolConfig, { chosenUpgrade: 'long-polling' });
      // Subsequent requests will use long polling
      const longPollResponse = await client.get('/api/data');
      logger.info('Long polling response', { data: longPollResponse.data });
    }
  }
}

// Make initial request
client.get('/api/data').then(handleResponse).catch(error => {
  logger.error('Request failed', { error: error.message });
});
```

**Key Points:**
- Send IROL config in headers to get available upgrades.
- Parse response headers to choose appropriate upgrade.
- Use `createIROLWebSocketClient` for WebSocket connections with built-in logging.
- Reconfigure HTTP client for chosen upgrades like long polling.

### Request Config Structure

The `IROL-Request-Config` header will contain a JSON object with the following fields (all optional, defaults handled by implementation):

- **`criticality`**: String enum indicating the importance of the request. Possible values: `"HIGH"`, `"MEDIUM"`, `"LOW"`. Defaults to `"MEDIUM"`.
- **`frequency`**: String enum indicating how often this type of request is expected. Possible values: `"ALWAYS"`, `"SOMETIMES"`, `"RARE"`. Defaults to `"SOMETIMES"`.
- **`timeout`**: Number (in milliseconds) for request timeout. If not specified, uses default client/server timeouts.
- **`retries`**: Number indicating the maximum retry attempts. Defaults to 0.
- **`priority`**: Number (1-10) for queuing or processing priority on the server. Higher numbers indicate higher priority. Defaults to 5.
- **`features`**: Array of strings for feature flags or tags (e.g., `["experimental", "premium"]`). Defaults to empty array.

Example JSON: `{"criticality": "HIGH", "frequency": "ALWAYS", "timeout": 5000, "retries": 3, "priority": 8, "features": ["premium"]}`.

### Implementation Plan

1. **Core Types and Interfaces**: Define TypeScript interfaces for config, services, etc.
2. **Server Middleware**: Function that wraps server response objects to inject headers based on predefined or dynamic service lists.
3. **Client Interceptor**: Function to modify outgoing requests by adding the config header.
4. **Configuration Options**: Allow users to customize header names, default values, etc.
5. **Examples and Documentation**: Provide integration examples for popular frameworks.
6. **Testing**: Unit tests for header injection and parsing.

### Next Steps

- Set up the project structure with TypeScript, Jest for testing, and build tools.
- Implement the core library.
- Create example applications demonstrating integration.