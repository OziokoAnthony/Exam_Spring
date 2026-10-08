'use client';

import { useEffect, useState } from 'react';

import DashboardShell from '@/components/DashboardShell';
import { api } from '@/lib/api/client';
import { db } from '@/lib/offline/db';

type Pack = {
  id: string;
  subjectId: string;
  version: number;
  name: string;
  sizeBytes: number | null;
  questionCount: number;
  publishedAt: string | null;
};

export default function PacksPage() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [downloaded, setDownloaded] = useState<string[]>([]);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api<Pack[]>('/content-packs')
      .then(setPacks)
      .catch(() => undefined);
    db.contentPacks
      .toCollection()
      .primaryKeys()
      .then((keys) => setDownloaded(keys as string[]));
  }, []);

  async function download(pack: Pack) {
    setBusy(pack.id);
    try {
      const manifest = await api<unknown>(`/content-packs/${pack.id}/manifest`);
      await db.contentPacks.put({
        id: pack.id,
        subjectId: pack.subjectId,
        version: pack.version,
        name: pack.name,
        downloadedAt: Date.now(),
        manifest,
      });
      setDownloaded((await db.contentPacks.toCollection().primaryKeys()) as string[]);
    } finally {
      setBusy('');
    }
  }

  return (
    <>
      <DashboardShell title="Offline packs" />
      <section className="flex flex-col gap-3 px-4 pb-8">
        {packs.length === 0 && <p className="text-gray-600">No published packs yet.</p>}
        {packs.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-xs text-gray-600">
                v{p.version} · {p.questionCount} questions ·{' '}
                {p.sizeBytes ? `${Math.round(p.sizeBytes / 1024)} KB` : 'size unknown'}
              </p>
            </div>
            <button
              onClick={() => download(p)}
              disabled={busy === p.id || downloaded.includes(p.id)}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {downloaded.includes(p.id) ? 'Saved' : busy === p.id ? 'Saving…' : 'Download'}
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
