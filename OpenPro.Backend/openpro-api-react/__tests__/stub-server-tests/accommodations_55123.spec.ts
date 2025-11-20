import { describe, it, expect } from 'vitest';
import { BASE_URL, RUN } from './helpers';

// Test: List accommodations for supplier 55123 (Un gite Dans le Cotentin).
// Verifies the single accommodation "Maison complète" is present.
describe('Stub: accommodations for 55123 (Un gite Dans le Cotentin)', () => {
  it('returns Maison complète', async () => {
    if (!RUN) return expect(true).toBe(true);
    const res = await fetch(`${BASE_URL}/fournisseur/55123/hebergements`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body?.ok).toBe(1);
    const list = body?.data?.hebergements ?? [];
    const names = list.map((h: any) => h?.nom);
    expect(names).toEqual(expect.arrayContaining(['Maison complète']));
  });
});


