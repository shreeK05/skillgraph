"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function AdminPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const runSeed = async () => {
    setRunning(true);
    setStatus(null);
    try {
      const res = await api.post('/admin/seed');
      setStatus(res.data.message || 'Seeding finished');
    } catch (e: any) {
      setStatus('Seeding failed: ' + (e?.response?.data?.detail || e?.message || 'Unknown error'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Admin Console</h1>
      <p className="mb-4 text-sm text-slate-600">Trigger idempotent seeders for local/demo environments.</p>
      <button onClick={runSeed} disabled={running} className="bg-blue-600 text-white px-4 py-2 rounded-md">
        {running ? 'Seeding...' : 'Run Seeders (Postgres + Neo4j)'}
      </button>
      {status && <div className="mt-4 p-3 bg-slate-50 border rounded">{status}</div>}
    </div>
  );
}
