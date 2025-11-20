import { describe, it, expect } from 'vitest';
import { createOpenProClient } from '../../src/client/OpenProClient';
import { mockFetch, jsonOk } from '../helpers';

describe('OpenProClient (admin).createRateType', () => {
  it('returns idTypeTarif', async () => {
    // Should POST a new rate type and return the created identifier
    mockFetch.mockResolvedValueOnce(jsonOk({ idTypeTarif: 9 }));
    const client = createOpenProClient('admin', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });
    const res = await client.createRateType(1, {
      libelle: [{ langue: 'fr', texte: 'Tarif public' }],
      description: [{ langue: 'fr', texte: 'desc' }],
      ordre: 1
    });
    expect(res).toEqual({ idTypeTarif: 9 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});


