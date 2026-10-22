'use client';

import { useCallback, useEffect, useState } from 'react';

import { DashboardShell } from '@/components/DashboardShell';
import { Button, Empty, ErrorText, Loading } from '@/components/ui';
import { api, errorMessage } from '@/lib/api/client';
import { db } from '@/lib/offline/db';

type Pack = {
  id: string;
  subjectId: string;
  version: number;
  name: string;
  sizeBytes: number | null;
  questionCount: number;
};

function sizeLabel(bytes: number | null): string {
  if (!bytes) return 'size unknown';
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[] | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const refreshSaved = useCallback(async () => {
    const keys = await db.contentPacks.toCollection().primaryKeys();
    setSaved(new Set(keys));
  }, []);

  useEffect(() => {
    void refreshSaved();
    api<Pack[]>('/content-packs')
      .then(setPacks)
      .catch((e: unknown) => {
        setPacks([]);
        setError(errorMessage(e, 'Could not load packs'));
      });
  }, [refreshSaved]);

  async function download(pack: Pack) {
    setBusy(pack.id);
    setError('');
    try {
      const manifest = await api<unknown>(`/content-packs/${pack.id}/manifest`);
      await db.contentPacks.put({ ...pack, downloadedAt: Date.now(), manifest });
      await refreshSaved();
    } catch (e) {
      setError(errorMessage(e, 'Download failed'));
    } finally {
      setBusy('');
    }
  }

  async function remove(pack: Pack) {
    await db.contentPacks.delete(pack.id);
    await refreshSaved();
  }

  return (
    <DashboardShell title="Offline packs">
      <p className="text-sm text-gray-700">
        Download a subject once on Wi-Fi, then practise without data. Your answers sync when you
        reconnect.
      </p>
      <ErrorText message={error} />
      {packs === null && <Loading />}
      {packs?.length === 0 && !error && <Empty>No packs are available yet.</Empty>}
      <ul className="flex flex-col gap-3">
        {packs?.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 rounded border p-3">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-gray-600">
                Version {p.version} · {p.questionCount} questions · {sizeLabel(p.sizeBytes)}
              </p>
            </div>
            {saved.has(p.id) ? (
              <Button variant="secondary" onClick={() => void remove(p)}>
                Remove
              </Button>
            ) : (
              <Button onClick={() => void download(p)} busy={busy === p.id}>
                Download
              </Button>
            )}
          </li>
        ))}
      </ul>
    </DashboardShell>
  );
}
