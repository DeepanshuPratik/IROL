import { Request, Response, NextFunction } from 'express';
import { createIROLServerMiddleware } from './server';
import { logger } from '../logger';

describe('createIROLServerMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    mockReq = {
      get: jest.fn(),
      ip: '127.0.0.1',
      url: '/test',
      on: jest.fn(),
    };
    mockRes = {
      set: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      end: jest.fn(),
      headersSent: false,
    };
    mockNext = jest.fn();
    jest.useFakeTimers();
    loggerSpy = jest.spyOn(logger, 'info').mockReturnValue(logger);
    jest.spyOn(logger, 'warn').mockReturnValue(logger);
    jest.spyOn(logger, 'error').mockReturnValue(logger);
  });

  afterEach(() => {
    jest.clearAllTimers();
    loggerSpy.mockRestore();
  });

  it('should set default upgrades header when no config header is present', () => {
    (mockReq.get as jest.Mock).mockReturnValue(undefined);
    const middleware = createIROLServerMiddleware();

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.set).toHaveBeenCalledWith('IROL-Available-Upgrades', JSON.stringify(['normal-request', 'short-polling', 'long-polling']));
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle long polling by delaying response', () => {
    (mockReq.get as jest.Mock).mockImplementation((header: string) => {
      if (header === 'IROL-Request-Config') return JSON.stringify({ criticality: 'HIGH' });
      if (header === 'IROL-Chosen-Upgrade') return 'long-polling';
      return undefined;
    });
    const middleware = createIROLServerMiddleware({ longPollingTimeout: 1000 });

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled(); // Should not call next for long polling
    expect(loggerSpy).toHaveBeenCalledWith('Initiating long polling', expect.objectContaining({ timeout: 1000 }));

    // Fast-forward time to simulate data arrival
    jest.advanceTimersByTime(500); // Assume data arrives at 500ms

    expect(loggerSpy).toHaveBeenCalledWith('Sending long polling data', expect.any(Object));
    expect(mockRes.set).toHaveBeenCalledWith('IROL-Available-Upgrades', JSON.stringify(['normal-request', 'websockets', 'long-polling']));
    expect(mockRes.set).toHaveBeenCalledWith('IROL-Active-Upgrade', 'long-polling');
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Data from long polling',
      upgrade: 'long-polling'
    }));
  });

  it('should handle short polling by proceeding normally', () => {
    (mockReq.get as jest.Mock).mockImplementation((header: string) => {
      if (header === 'IROL-Request-Config') return JSON.stringify({ criticality: 'LOW' });
      if (header === 'IROL-Chosen-Upgrade') return 'short-polling';
      return undefined;
    });
    const middleware = createIROLServerMiddleware();

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.set).toHaveBeenCalledWith('IROL-Available-Upgrades', JSON.stringify(['normal-request', 'short-polling', 'long-polling']));
    expect(mockRes.set).toHaveBeenCalledWith('IROL-Active-Upgrade', 'short-polling');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should parse config header and set appropriate upgrades', () => {
    const config = JSON.stringify({ criticality: 'HIGH', frequency: 'ALWAYS' });
    (mockReq.get as jest.Mock).mockReturnValue(config);
    const middleware = createIROLServerMiddleware();

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.set).toHaveBeenCalledWith('IROL-Available-Upgrades', JSON.stringify(['normal-request', 'websockets']));
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle invalid JSON in config header gracefully', () => {
    (mockReq.get as jest.Mock).mockReturnValue('invalid json');
    const middleware = createIROLServerMiddleware();

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.set).toHaveBeenCalledWith('IROL-Available-Upgrades', JSON.stringify(['normal-request', 'short-polling', 'long-polling']));
    expect(mockNext).toHaveBeenCalled();
  });

  it('should use custom header names', () => {
    const config = JSON.stringify({ criticality: 'HIGH' });
    (mockReq.get as jest.Mock).mockReturnValue(config);
    const middleware = createIROLServerMiddleware({
      headerConfig: 'Custom-Config',
      headerUpgrades: 'Custom-Upgrades',
    });

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.get).toHaveBeenCalledWith('Custom-Config');
    expect(mockRes.set).toHaveBeenCalledWith('Custom-Upgrades', JSON.stringify(['normal-request', 'websockets', 'long-polling']));
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle invalid WebSocket upgrade', () => {
    (mockReq.get as jest.Mock).mockImplementation((header: string) => {
      if (header === 'IROL-Chosen-Upgrade') return 'websockets';
      return undefined;
    });
    mockReq.headers = {}; // No upgrade headers

    const middleware = createIROLServerMiddleware();

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid WebSocket upgrade' });
    expect(logger.warn).toHaveBeenCalledWith('Invalid WebSocket upgrade request');
  });
});