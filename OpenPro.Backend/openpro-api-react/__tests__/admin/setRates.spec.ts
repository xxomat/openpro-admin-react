import { describe, it, expect } from 'vitest';
import { createOpenProClient } from '../../src/client/OpenProClient';
import { mockFetch, jsonOk } from '../helpers';

describe('OpenProClient (admin).setRates', () => {
  it('posts payload and returns data', async () => {
    // Should POST the "tarifs" payload and echo back a structure (warnings or result)
    mockFetch.mockResolvedValueOnce(jsonOk({ warnings: [] }));
    const client = createOpenProClient('admin', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });
    const res = await client.setRates(1, 2, {
      tarifs: [{
        idTypeTarif: 9,
        debut: '2026-03-16',
        fin: '2026-03-16',
        ouvert: true,
        dureeMin: 1,
        dureeMax: 14,
        arriveeAutorisee: true,
        departAutorise: true,
        tarifPax: { listeTarifPaxOccupation: [] }
      }]
    });
    expect(res).toEqual({ warnings: [] });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});


