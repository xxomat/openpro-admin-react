import { describe, it, expect } from 'vitest';
import { BASE_URL, RUN } from './helpers';

// Test: List accommodations for supplier 47186 (La Becterie).
// Ensures the stub returns the expected hébergements names.
describe('Stub: accommodations for 47186 (La Becterie)', () => {
  it('returns Noirmoutier, Ceylan, Porquerolles', async () => {
    if (!RUN) return expect(true).toBe(true);
    const res = await fetch(`${BASE_URL}/fournisseur/47186/hebergements`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body?.ok).toBe(1);
    const list = body?.data?.hebergements ?? [];
    const names = list.map((h: any) => h?.nom);
    expect(names).toEqual(expect.arrayContaining(['Noirmoutier', 'Ceylan', 'Porquerolles']));
  });
});


