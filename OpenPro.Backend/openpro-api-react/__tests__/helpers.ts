import { vi, beforeEach, afterEach } from 'vitest';

export const mockFetch = vi.fn();

export const jsonOk = (data: unknown) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify({ ok: 1, data })
});

beforeEach(() => {
  // @ts-expect-error override
  global.fetch = mockFetch;
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});


