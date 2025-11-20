import { describe, it, expect } from 'vitest';
import { BASE_URL, RUN } from './helpers';

// Test: Rates for 47186:3 (Porquerolles) should contain at least one period
// and include pax pricing (listeTarifPaxOccupation).
describe('Stub: rates for 47186:3 (Porquerolles)', () => {
  it('has periods and pax pricing entries', async () => {
    if (!RUN) return expect(true).toBe(true);
    const res = await fetch(`${BASE_URL}/fournisseur/47186/hebergements/3/typetarifs/tarif`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body?.ok).toBe(1);
    const periodes = body?.data?.periodes ?? [];
    expect(Array.isArray(periodes)).toBe(true);
    expect(periodes.length).toBeGreaterThan(0);
    const hasPax = periodes.some((p: any) => p?.tarifPax?.listeTarifPaxOccupation?.length);
    expect(hasPax).toBe(true);
  });
});


