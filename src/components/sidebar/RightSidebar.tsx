import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BookOpen, ExternalLink, Terminal, X } from 'lucide-react';
import type { ColibriNode } from '../../types/colibri';
import { useAppStore } from '../../store/useAppStore';
import { nodeStyle } from '../../lib/nodeStyle';
import { dbtCommand } from '../../lib/dbtCommand';
import { columnKey } from '../../lib/graphIndex';
import { CodeBlock, CopyButton } from './CodeBlock';
import { ColumnsTable, TestChips } from './ColumnsTable';
import { lineageLabel } from '../graph/LineageBadge';

type Tab = 'details' | 'columns' | 'code';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-gray-900 dark:text-gray-100">{children}</dd>
    </div>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return <span className="text-gray-400">None</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <span key={t} className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {t}
        </span>
      ))}
    </div>
  );
}

export function ExposureDetails({ node }: { node: ColibriNode }) {
  const meta = node.exposure_metadata;
  return (
    <dl className="space-y-3">
      <Field label="Description">{node.description || <span className="text-gray-400">No description available</span>}</Field>
      <Field label="Owner">
        {meta?.owner?.name || meta?.owner?.email ? (
          <span>
            {meta.owner.name}
            {meta.owner.email && <span className="block text-xs text-gray-500">{meta.owner.email}</span>}
          </span>
        ) : (
          <span className="text-gray-400">No owner defined</span>
        )}
      </Field>
      <Field label="Type">{meta?.type ?? <span className="text-gray-400">None</span>}</Field>
      <Field label="Maturity">{meta?.maturity ?? <span className="text-gray-400">None</span>}</Field>
      {meta?.url && (
        <Field label="URL">
          <a href={meta.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400">
            {meta.url} <ExternalLink className="h-3 w-3" />
          </a>
        </Field>
      )}
      <Field label="Path">{node.path ?? '—'}</Field>
      <Field label="Tags">
        <TagList tags={node.tags} />
      </Field>
    </dl>
  );
}

function ColumnLineagePanel({ node }: { node: ColibriNode }) {
  const selectedColumn = useAppStore((s) => s.selectedColumn);
  const index = useAppStore((s) => s.index);
  const manifest = useAppStore((s) => s.manifest);
  const selectColumn = useAppStore((s) => s.selectColumn);
  if (!selectedColumn || selectedColumn.node !== node.id || !index || !manifest) return null;
  const column = node.columns[selectedColumn.column];
  const key = columnKey(node.id, selectedColumn.column);
  const upstream = index.columnUp.get(key) ?? [];
  const downstream = index.columnDown.get(key) ?? [];
  const structural = index.structuralBySource.get(key) ?? [];

  const refList = (refs: { node: string; column: string }[]) => (
    <ul className="space-y-0.5">
      {refs.map((r) => (
        <li key={`${r.node}.${r.column}`}>
          <button
            type="button"
            onClick={() => selectColumn({ node: r.node, column: r.column })}
            className="w-full truncate rounded px-1 text-left font-mono text-[11px] text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950"
            title={`${r.node}.${r.column}`}
          >
            {manifest.nodes[r.node]?.name ?? r.node}.{r.column}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50/60 p-3 text-xs dark:border-blue-900 dark:bg-blue-950/40">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-gray-900 dark:text-gray-100">{selectedColumn.column}</span>
        <span className="text-gray-500">{column?.lineageType ? lineageLabel(column.lineageType) : ''}</span>
      </div>
      {upstream.length === 0 && downstream.length === 0 && structural.length === 0 ? (
        <p className="text-gray-500">Column lineage unavailable</p>
      ) : (
        <div className="space-y-2">
          {upstream.length > 0 && (
            <div>
              <div className="mb-0.5 text-[10px] font-medium text-gray-500 uppercase">Upstream ({upstream.length})</div>
              {refList(upstream)}
            </div>
          )}
          {downstream.length > 0 && (
            <div>
              <div className="mb-0.5 text-[10px] font-medium text-gray-500 uppercase">Downstream ({downstream.length})</div>
              {refList(downstream)}
            </div>
          )}
          {structural.length > 0 && (
            <div>
              <div className="mb-0.5 text-[10px] font-medium text-gray-500 uppercase">Used in join / filter of</div>
              <ul className="space-y-0.5">
                {structural.map((s) => (
                  <li key={`${s.edgeType}.${s.node}`} className="truncate font-mono text-[11px] text-gray-700 dark:text-gray-300">
                    <span className={s.edgeType === 'join' ? 'text-orange-600' : 'text-purple-600'}>{s.edgeType}</span> →{' '}
                    {manifest.nodes[s.node]?.name ?? s.node}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NodeDetails({ node }: { node: ColibriNode }) {
  return (
    <dl className="space-y-3">
      {node.catalogMissing && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>Missing from catalog: columns may be incomplete. Run `dbt docs generate` after building this model.</span>
        </div>
      )}
      <Field label="Description">{node.description || <span className="text-gray-400">No description available</span>}</Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Node Type">{node.nodeType}</Field>
        <Field label="Materialization">{node.materialized ?? '—'}</Field>
        <Field label="Model Type">{node.modelType}</Field>
        <Field label="Contract">{node.contractEnforced ? 'Enforced' : 'Not enforced'}</Field>
        <Field label="Database">{node.database ?? '—'}</Field>
        <Field label="Schema">{node.schema ?? '—'}</Field>
      </div>
      <Field label="Database Relation">
        <span className="font-mono text-xs">{node.relationName ?? '—'}</span>
      </Field>
      <Field label="Path">
        <span className="font-mono text-xs">{node.path ?? '—'}</span>
      </Field>
      <Field label="Tags">
        <TagList tags={node.tags} />
      </Field>
      {node.tests && node.tests.length > 0 && (
        <Field label="Model Tests">
          <TestChips tests={node.tests} />
        </Field>
      )}
    </dl>
  );
}

export function RightSidebar() {
  const manifest = useAppStore((s) => s.manifest);
  const detailNode = useAppStore((s) => s.detailNode);
  const selectedColumn = useAppStore((s) => s.selectedColumn);
  const selectColumn = useAppStore((s) => s.selectColumn);
  const setRightOpen = useAppStore((s) => s.setRightOpen);
  const [tab, setTab] = useState<Tab>('details');
  const [codeKind, setCodeKind] = useState<'compiled' | 'raw'>('compiled');

  const node = detailNode ? manifest?.nodes[detailNode] : undefined;

  if (!node) {
    return (
      <aside className="flex h-full w-full items-center justify-center border-l border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950">
        Select a node to view details
      </aside>
    );
  }

  const style = nodeStyle(node);
  const Icon = style.icon;
  const isExposure = node.nodeType === 'exposure';
  const code = codeKind === 'compiled' ? node.compiledCode ?? null : node.rawCode;
  const command = dbtCommand([node]);
  const tabs: { id: Tab; label: string }[] = isExposure
    ? [{ id: 'details', label: 'Details' }]
    : [
        { id: 'details', label: 'Details' },
        { id: 'columns', label: `Columns (${Object.keys(node.columns).length})` },
        { id: 'code', label: 'Code' },
      ];
  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'details';

  return (
    <aside className="flex h-full w-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="border-b border-gray-200 p-3 dark:border-gray-800">
        <div className="flex items-start gap-2">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconColor}`} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={node.name}>
              {node.name}
            </div>
            <div className="truncate text-xs text-gray-500" title={node.fullName}>
              {node.fullName}
            </div>
          </div>
          <Link to={`/docs/${encodeURIComponent(node.id)}`} title="Model Documentation" className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100">
            <BookOpen className="h-3.5 w-3.5" />
          </Link>
          <button type="button" title="Close (Ctrl+\)" onClick={() => setRightOpen(false)} className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {command && (
          <div className="mt-2 flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 font-mono text-[11px] text-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <Terminal className="h-3 w-3 shrink-0" />
            <span className="min-w-0 flex-1 truncate" title={command}>
              {command}
            </span>
            <CopyButton text={command} title="Copy dbt command" />
          </div>
        )}
        <div className="mt-3 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-2 py-1 text-xs font-medium ${
                activeTab === t.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <ColumnLineagePanel node={node} />
        {activeTab === 'details' && (isExposure ? <ExposureDetails node={node} /> : <NodeDetails node={node} />)}
        {activeTab === 'columns' && (
          <ColumnsTable
            columns={node.columns}
            selectedColumn={selectedColumn?.node === node.id ? selectedColumn.column : null}
            onColumnClick={(column) => selectColumn({ node: node.id, column })}
          />
        )}
        {activeTab === 'code' && (
          <div className="space-y-2">
            <div className="inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              {(['compiled', 'raw'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCodeKind(k)}
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    codeKind === k ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-gray-100' : 'text-gray-500'
                  }`}
                >
                  {k === 'compiled' ? 'Compiled' : 'Raw'}
                </button>
              ))}
            </div>
            {code ? <CodeBlock code={code} /> : <p className="text-sm text-gray-500">No {codeKind} code available.</p>}
          </div>
        )}
      </div>
    </aside>
  );
}
