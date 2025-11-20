import { describe, it, expect } from 'vitest';
import { createOpenProClient } from '../../src/client/OpenProClient';
import { mockFetch, jsonOk } from '../helpers';

describe('OpenProClient.listBookings', () => {
  it('returns data', async () => {
    // Should return the booking list payload with pagination meta fields
    mockFetch.mockResolvedValueOnce(jsonOk({ dossiers: [], nbTotal: 0, pageCourante: 1, nbPages: 1 }));

    const client = createOpenProClient('customer', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });

    const data = await client.listBookings(1, { page: 1, nbParPage: 20 });
    expect(data).toEqual({ dossiers: [], nbTotal: 0, pageCourante: 1, nbPages: 1 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('forwards query params', async () => {
    // Should include pagination params in the request URL (page, nbParPage)
    mockFetch.mockResolvedValueOnce(jsonOk({ dossiers: [], pageCourante: 2 }));
    const client = createOpenProClient('customer', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });
    const res = await client.listBookings(1, { page: 2, nbParPage: 10 });
    expect(res.pageCourante).toBe(2);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl: string = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('/fournisseur/1/dossiers?');
  });
});


