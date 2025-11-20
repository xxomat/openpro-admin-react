import React from 'react';
import { createOpenProClient } from '@client/OpenProClient';
import type {
  AccommodationListResponse,
  Booking,
  BookingList,
  RatesListResponse,
  StockResponse
} from '@client/types';

export function App() {
  const [baseUrl, setBaseUrl] = React.useState<string>('');
  const [apiKey, setApiKey] = React.useState<string>('');
  const [idFournisseur, setIdFournisseur] = React.useState<string>('');
  const [idDossier, setIdDossier] = React.useState<string>('');
  const [idHebergement, setIdHebergement] = React.useState<string>('');
  const [output, setOutput] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [lastType, setLastType] = React.useState<null | 'accommodations' | 'bookings' | 'booking' | 'rates' | 'stock'>(null);
  const [lastData, setLastData] = React.useState<unknown>(null);
  const [activeTab, setActiveTab] = React.useState<'customer' | 'admin'>('customer');
  const [adminStockPayload, setAdminStockPayload] = React.useState<string>('{\n  "jours": [\n    { "date": "2025-06-01", "dispo": 3 },\n    { "date": "2025-06-02", "dispo": 2 }\n  ]\n}');

  const handleListAccommodations = async () => {
    setLoading(true);
    setOutput('');
    try {
      const client = createOpenProClient('customer', {
        baseUrl,
        apiKey
      });
      const res: AccommodationListResponse = await client.listAccommodations(Number(idFournisseur));
      setOutput(JSON.stringify(res, null, 2));
      setLastType('accommodations');
      setLastData(res);
    } catch (e) {
      setOutput(String(e));
      setLastType(null);
    } finally {
      setLoading(false);
    }
  };

  const handleListBookings = async () => {
    setLoading(true);
    setOutput('');
    try {
      const client = createOpenProClient('customer', {
        baseUrl,
        apiKey
      });
      const res: BookingList = await client.listBookings(Number(idFournisseur));
      setOutput(JSON.stringify(res, null, 2));
      setLastType('bookings');
      setLastData(res);
    } catch (e) {
      setOutput(String(e));
      setLastType(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetBooking = async () => {
    setLoading(true);
    setOutput('');
    try {
      const client = createOpenProClient('customer', {
        baseUrl,
        apiKey
      });
      const res: Booking = await client.getBooking(Number(idFournisseur), Number(idDossier));
      setOutput(JSON.stringify(res, null, 2));
      setLastType('booking');
      setLastData(res);
    } catch (e) {
      setOutput(String(e));
      setLastType(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRates = async () => {
    setLoading(true);
    setOutput('');
    try {
      const client = createOpenProClient('customer', {
        baseUrl,
        apiKey
      });
      const res: RatesListResponse = await client.getRates(Number(idFournisseur), Number(idHebergement));
      setOutput(JSON.stringify(res, null, 2));
      setLastType('rates');
      setLastData(res);
    } catch (e) {
      setOutput(String(e));
      setLastType(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStock = async () => {
    setLoading(true);
    setOutput('');
    try {
      const client = createOpenProClient('customer', {
        baseUrl,
        apiKey
      });
      const res: StockResponse = await client.getStock(Number(idFournisseur), Number(idHebergement));
      setOutput(JSON.stringify(res, null, 2));
      setLastType('stock');
      setLastData(res);
    } catch (e) {
      setOutput(String(e));
      setLastType(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Admin handlers ---
  const handleAdminListRateTypes = async () => {
    setLoading(true);
    setOutput('');
    try {
      const client = createOpenProClient('admin', { baseUrl, apiKey });
      const res = await client.listRateTypes(Number(idFournisseur));
      setOutput(JSON.stringify(res, null, 2));
    } catch (e) {
      setOutput(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAdminUpdateStock = async () => {
    setLoading(true);
    setOutput('');
    try {
      const client = createOpenProClient('admin', { baseUrl, apiKey });
      const payload = JSON.parse(adminStockPayload);
      await client.updateStock(Number(idFournisseur), Number(idHebergement), payload);
      setOutput('{"ok":1,"data":{"saved":true}}');
    } catch (e) {
      setOutput(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1>OpenPro Playground</h1>
      <div style={{ color: '#555' }}>
        Base URL examples:
        <ul style={{ marginTop: 8 }}>
          <li>
            Stub server: http://localhost:3000
            <button
              style={{ marginLeft: 8, padding: '2px 8px' }}
              onClick={() => setBaseUrl('http://localhost:3000')}
            >
              Set URL
            </button>
          </li>
          <li>
            OpenPro: https://api.open-pro.fr/tarif/multi/v1
            <button
              style={{ marginLeft: 8, padding: '2px 8px' }}
              onClick={() => setBaseUrl('https://api.open-pro.fr/tarif/multi/v1')}
            >
              Set URL
            </button>
          </li>
        </ul>
      </div>

      {/* Quick presets for fournisseurs/hébergements (from stub dataset) */}
      <div style={{ marginTop: 12, color: '#555' }}>
        Presets (idFournisseur / idHebergement):
        <ul style={{ marginTop: 8 }}>
          <li>
            La Becterie — Noirmoutier (47186 / 1)
            <button
              style={{ marginLeft: 8, padding: '2px 8px' }}
              onClick={() => { setIdFournisseur('47186'); setIdHebergement('1'); }}
            >
              Set
            </button>
          </li>
          <li>
            La Becterie — Ceylan (47186 / 2)
            <button
              style={{ marginLeft: 8, padding: '2px 8px' }}
              onClick={() => { setIdFournisseur('47186'); setIdHebergement('2'); }}
            >
              Set
            </button>
          </li>
          <li>
            La Becterie — Porquerolles (47186 / 3)
            <button
              style={{ marginLeft: 8, padding: '2px 8px' }}
              onClick={() => { setIdFournisseur('47186'); setIdHebergement('3'); }}
            >
              Set
            </button>
          </li>
          <li>
            Un gite Dans le Cotentin — Maison complète (55123 / 1)
            <button
              style={{ marginLeft: 8, padding: '2px 8px' }}
              onClick={() => { setIdFournisseur('55123'); setIdHebergement('1'); }}
            >
              Set
            </button>
          </li>
          <li>
            Fournisseur factice — Hébergement non existant (99999 / 1)
            <button
              style={{ marginLeft: 8, padding: '2px 8px' }}
              onClick={() => { setIdFournisseur('99999'); setIdHebergement('1'); }}
            >
              Set
            </button>
          </li>
        </ul>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setActiveTab('customer')}
          style={{ padding: '6px 12px', border: '1px solid #ddd', background: activeTab === 'customer' ? '#e8f0fe' : '#fff' }}
        >
          Customer
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          style={{ padding: '6px 12px', border: '1px solid #ddd', background: activeTab === 'admin' ? '#e8f0fe' : '#fff' }}
        >
          Admin
        </button>
      </div>

      <div style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
        <label>
          Base URL
          <input
            style={{ width: '100%' }}
            placeholder="https://sandbox.example/api"
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
          />
        </label>
        <label>
          API Key
          <input
            style={{ width: '100%' }}
            placeholder="OsApiKey ... (without prefix)"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </label>
        <label>
          idFournisseur
          <input
            style={{ width: '100%' }}
            placeholder="47186"
            value={idFournisseur}
            onChange={e => setIdFournisseur(e.target.value)}
          />
        </label>
        <label>
          idDossier
          <input
            style={{ width: '100%' }}
            placeholder="123"
            value={idDossier}
            onChange={e => setIdDossier(e.target.value)}
          />
        </label>
        <label>
          idHebergement
          <input
            style={{ width: '100%' }}
            placeholder="1"
            value={idHebergement}
            onChange={e => setIdHebergement(e.target.value)}
          />
        </label>
      </div>

      {activeTab === 'customer' && (
        <div style={{ marginTop: 12 }}>
          <button onClick={handleListAccommodations} disabled={loading || !baseUrl || !apiKey || !idFournisseur}>
            {loading ? 'Loading...' : 'List accommodations'}
          </button>
          <button style={{ marginLeft: 8 }} onClick={handleListBookings} disabled={loading || !baseUrl || !apiKey || !idFournisseur}>
            {loading ? 'Loading...' : 'List bookings'}
          </button>
          <button style={{ marginLeft: 8 }} onClick={handleGetBooking} disabled={loading || !baseUrl || !apiKey || !idFournisseur || !idDossier}>
            {loading ? 'Loading...' : 'Get booking'}
          </button>
          <button style={{ marginLeft: 8 }} onClick={handleGetRates} disabled={loading || !baseUrl || !apiKey || !idFournisseur || !idHebergement}>
            {loading ? 'Loading...' : 'Get rates'}
          </button>
          <button style={{ marginLeft: 8 }} onClick={handleGetStock} disabled={loading || !baseUrl || !apiKey || !idFournisseur || !idHebergement}>
            {loading ? 'Loading...' : 'Get stock'}
          </button>
        </div>
      )}

      {activeTab === 'admin' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
            <label>
              Stock payload (JSON)
              <textarea
                style={{ width: '100%', minHeight: 120, fontFamily: 'monospace' }}
                value={adminStockPayload}
                onChange={e => setAdminStockPayload(e.target.value)}
              />
            </label>
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={handleAdminListRateTypes} disabled={loading || !baseUrl || !apiKey || !idFournisseur}>
              {loading ? 'Loading...' : 'List rate types'}
            </button>
            <button style={{ marginLeft: 8 }} onClick={handleAdminUpdateStock} disabled={loading || !baseUrl || !apiKey || !idFournisseur || !idHebergement}>
              {loading ? 'Loading...' : 'Update stock (POST)'}
            </button>
          </div>
        </div>
      )}

      {/* Quick formatted summary */}
      <div style={{ marginTop: 16, padding: 12, background: '#fbfbfb', border: '1px solid #eee' }}>
        <strong>Summary</strong>
        <div style={{ marginTop: 8, color: '#333' }}>
          {lastType === 'accommodations' && (() => {
            const data = lastData as AccommodationListResponse | null;
            const count = data?.listeHebergement?.length ?? 0;
            return <div>Accommodations: {count}</div>;
          })()}
          {lastType === 'bookings' && (() => {
            const data = lastData as BookingList | null;
            const count = data?.dossiers?.length ?? 0;
            const refs = (data?.dossiers ?? []).slice(0, 3).map((d: any) => d?.reference).filter(Boolean);
            return <div>Bookings: {count}{refs.length ? ` — sample: ${refs.join(', ')}` : ''}</div>;
          })()}
          {lastType === 'booking' && (() => {
            const d = lastData as Booking | null;
            return <div>Booking #{d?.idDossier} — {d?.reference} — {d?.hebergement?.dateArrivee} → {d?.hebergement?.dateDepart}</div>;
          })()}
          {lastType === 'rates' && (() => {
            const r = lastData as RatesListResponse | null;
            const n = r?.tarifs?.length ?? 0;
            return <div>Rates entries: {n}</div>;
          })()}
          {lastType === 'stock' && (() => {
            const s = lastData as StockResponse | null;
            const n = (s as any)?.stock?.length ?? 0;
            return <div>Stock days: {n}</div>;
          })()}
          {!lastType && <div>No data.</div>}
        </div>
      </div>

      <pre style={{ marginTop: 16, background: '#f7f7f7', padding: 12, overflow: 'auto' }}>
        {output || 'No output yet.'}
      </pre>
    </div>
  );
}


