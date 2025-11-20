import { describe, it, expect } from 'vitest';
import { BASE_URL, RUN } from './helpers';

// Test: Stock for 47186:1 should be available (dispo = 1).
// Validates the generated stock for La Becterie / Noirmoutier.
describe('Stub: stock for 47186:1 (available)', () => {
  it('returns at least one day with dispo = 1', async () => {
    if (!RUN) return expect(true).toBe(true);
    const res = await fetch(`${BASE_URL}/fournisseur/47186/hebergements/1/stock`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body?.ok).toBe(1);
    const jours = body?.data?.jours ?? [];
    expect(jours.length).toBeGreaterThan(0);
    expect(jours[0]?.dispo).toBe(1);
  });
});


