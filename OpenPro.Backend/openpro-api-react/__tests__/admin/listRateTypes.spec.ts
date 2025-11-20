import { describe, it, expect } from 'vitest';
import { createOpenProClient } from '../../src/client/OpenProClient';
import { mockFetch, jsonOk } from '../helpers';

describe('OpenProClient (admin).listRateTypes', () => {
  it('returns data', async () => {
    // Should fetch admin rate types list and return the "typeTarifs" array
    mockFetch.mockResolvedValueOnce(jsonOk({ typeTarifs: [] }));

    const client = createOpenProClient('admin', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });

    const data = await client.listRateTypes(1);
    expect(data).toEqual({ typeTarifs: [] });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});


