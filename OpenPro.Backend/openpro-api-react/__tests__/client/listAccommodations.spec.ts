import { describe, it, expect } from 'vitest';
import { createOpenProClient } from '../../src/client/OpenProClient';
import { mockFetch } from '../helpers';

describe('OpenProClient.listAccommodations', () => {
  it('returns data on ok=1', async () => {
    // Should parse a successful API response and return the "listeHebergement" payload
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: 1, data: { listeHebergement: [] } })
    });

    const client = createOpenProClient('customer', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });

    const data = await client.listAccommodations(1);
    expect(data).toEqual({ listeHebergement: [] });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('throws on ok=0', async () => {
    // Should throw an error when the API returns ok=0 (logical failure)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: 0, data: {} })
    });

    const client = createOpenProClient('customer', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });

    await expect(client.listAccommodations(1)).rejects.toThrow();
  });
});


