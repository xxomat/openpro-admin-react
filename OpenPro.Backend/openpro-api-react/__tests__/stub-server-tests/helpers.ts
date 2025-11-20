import { beforeAll } from 'vitest';

// Base URL for the stub server; override with env if needed.
export const BASE_URL = process.env.OPENPRO_BASE_URL || 'http://localhost:3000';

// Whether the stub server is reachable; computed once for all tests.
export let RUN = false;

async function isStubRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/fournisseur/47186/hebergements`);
    return res.ok;
  } catch {
    return false;
  }
}

beforeAll(async () => {
  RUN = await isStubRunning();
});


