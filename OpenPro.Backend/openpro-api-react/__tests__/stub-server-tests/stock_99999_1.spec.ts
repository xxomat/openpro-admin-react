import { describe, it, expect } from 'vitest';
import { BASE_URL, RUN } from './helpers';

// Test: Stock for 99999:1 (fictive supplier) should be zero/unavailable.
// Confirms dataset encodes no availability for the non-existent accommodation.
describe('Stub: stock for 99999:1 (no availability)', () => {
  it('returns days with dispo = 0', async () => {
    if (!RUN) return expect(true).toBe(true);
    const res = await fetch(`${BASE_URL}/fournisseur/99999/hebergements/1/stock`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body?.ok).toBe(1);
    const jours = body?.data?.jours ?? [];
    expect(jours.length).toBeGreaterThan(0);
    for (const j of jours.slice(0, 10)) {
      expect(j?.dispo).toBe(0);
    }
  });
});


