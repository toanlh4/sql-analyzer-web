import { useRef, useState } from 'react';
import { AlertCircle, FileJson, Loader2, Upload } from 'lucide-react';
import sampleUrl from '../../../data/sample-colibri-manifest.json?url';
import { parseManifest, readManifestFile } from '../../lib/loadManifest';
import { useAppStore } from '../../store/useAppStore';

export function UploadScreen() {
  const loadManifest = useAppStore((s) => s.loadManifest);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (name: string, load: () => Promise<Parameters<typeof loadManifest>[0]>) => {
    setLoading(true);
    setError(null);
    try {
      loadManifest(await load(), name);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadFile = (file: File | undefined) => {
    if (file) void run(file.name, () => readManifestFile(file));
  };

  const loadSample = () =>
    void run('sample-colibri-manifest.json', async () => {
      const res = await fetch(sampleUrl);
      if (!res.ok) throw new Error(`Failed to fetch sample (${res.status})`);
      return parseManifest(await res.text());
    });

  return (
    <div className="flex h-full items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Colibri</h1>
          <p className="mt-1 text-sm text-gray-500">Column-level lineage for dbt projects</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            loadFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
              : 'border-gray-300 bg-white hover:border-blue-400 dark:border-gray-700 dark:bg-gray-950'
          }`}
        >
          {loading ? <Loader2 className="h-10 w-10 animate-spin text-blue-500" /> : <FileJson className="h-10 w-10 text-blue-500" />}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{loading ? 'Loading lineage data…' : 'Drop colibri-manifest.json here'}</p>
            <p className="mt-1 text-xs text-gray-500">
              or click to choose a file. Generate it with <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">colibri generate</code>.
            </p>
          </div>
          <span className="btn-primary inline-flex items-center gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Choose file
          </span>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              loadFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">Failed to load lineage data</p>
              <p className="text-xs break-words">{error}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={() => inputRef.current?.click()}>
              Try Again
            </button>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-gray-500">
          No file handy?{' '}
          <button type="button" onClick={loadSample} className="text-blue-600 hover:underline dark:text-blue-400" disabled={loading}>
            Load the sample project
          </button>
          . Files are read in your browser and never uploaded.
        </p>
      </div>
    </div>
  );
}
