// Mock ioredis to prevent real connections during tests.
// shared-types/src/index.ts re-exports cache/redis.ts which imports ioredis,
// so any test that imports @uw-flow/shared-types would otherwise open a real connection.
jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    quit: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  }));
});
