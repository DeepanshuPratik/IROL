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

- **`IROL-Available-Upgrades`**: A JSON-encoded array of strings representing available communication upgrade options suggested by the server based on the client's request config. These could include methods like short-polling, long-polling, WebSockets, etc. The server determines these dynamically to enable adaptive protocol negotiation. Example: `["short-polling", "long-polling", "websockets"]`. The client can then choose to upgrade its request handling accordingly.
- **`IROL-Request-Config`**: A JSON-encoded object specifying client-side request configurations. This header is set by the client interceptor and read by the server middleware to decide on available upgrades and other orchestration logic.

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