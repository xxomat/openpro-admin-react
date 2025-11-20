import { describe, it, expect } from 'vitest';
import { createOpenProClient } from '../../src/client/OpenProClient';
import { mockFetch, jsonOk } from '../helpers';

describe('OpenProClient (admin).listWebhooks', () => {
  it('returns list', async () => {
    // Should fetch and return the list of configured webhooks (url + emailAlerte)
    mockFetch.mockResolvedValueOnce(jsonOk({ webhooks: [{ url: 'https://x', emailAlerte: 'a@b.c' }] }));
    const client = createOpenProClient('admin', {
      baseUrl: 'https://example.test',
      apiKey: 'key'
    });
    const res = await client.listWebhooks();
    expect(res).toEqual({ webhooks: [{ url: 'https://x', emailAlerte: 'a@b.c' }] });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});


