import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Network } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { nodeStyle } from '../../lib/nodeStyle';
import { CodeBlock } from '../sidebar/CodeBlock';
import { ColumnsTable, TestChips } from '../sidebar/ColumnsTable';
import { ExposureDetails, Field, TagList } from '../sidebar/RightSidebar';

type Tab = 'overview' | 'code';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
      <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </section>
  );
}

export function ModelDocsPage() {
  const { nodeId = '' } = useParams();
  const navigate = useNavigate();
  const manifest = useAppStore((s) => s.manifest);
  const focusNode = useAppStore((s) => s.focusNode);
  const [tab, setTab] = useState<Tab>('overview');
  const [codeKind, setCodeKind] = useState<'compiled' | 'raw'>('compiled');

  const node = manifest?.nodes[nodeId];
  if (!node) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Node not found: <code>{nodeId}</code>.{' '}
        <Link to="/" className="text-blue-600 hover:underline">
          Back to lineage
        </Link>
      </div>
    );
  }

  const style = nodeStyle(node);
  const Icon = style.icon;
  const isExposure = node.nodeType === 'exposure';
  const code = codeKind === 'compiled' ? node.compiledCode ?? null : node.rawCode;

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl space-y-4 p-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="toolbar-btn" title="Back to lineage">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-100">{node.name}</h1>
            <p className="truncate text-xs text-gray-500">{node.fullName}</p>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex items-center gap-1.5"
            onClick={() => {
              focusNode(node.id);
              navigate('/');
            }}
          >
            <Network className="h-3.5 w-3.5" /> View lineage
          </button>
        </div>

        {isExposure ? (
          <Section title="About this Exposure">
            <ExposureDetails node={node} />
          </Section>
        ) : (
          <>
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
              {(['overview', 'code'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium ${
                    tab === t ? 'border-blue-500 text-blue-700 dark:text-blue-300' : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {t === 'overview' ? 'Overview' : 'Code'}
                </button>
              ))}
            </div>

            {tab === 'overview' && (
              <div className="space-y-4">
                <Section title="Description">
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {node.description || <span className="text-gray-400">No description available</span>}
                  </p>
                </Section>
                <Section title="Model Information">
                  <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Field label="Database">{node.database ?? '—'}</Field>
                    <Field label="Schema">{node.schema ?? '—'}</Field>
                    <Field label="Materialization">{node.materialized ?? '—'}</Field>
                    <Field label="Contract Enforced">{node.contractEnforced ? 'Yes' : 'No'}</Field>
                    <Field label="Node Type">{node.nodeType}</Field>
                    <Field label="Model Type">{node.modelType}</Field>
                    <div className="col-span-2">
                      <Field label="Relation">
                        <span className="font-mono text-xs">{node.relationName ?? '—'}</span>
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Field label="Path">
                        <span className="font-mono text-xs">{node.path ?? '—'}</span>
                      </Field>
                    </div>
                    <div className="col-span-2">
                      <Field label="Tags">
                        <TagList tags={node.tags} />
                      </Field>
                    </div>
                  </dl>
                  {node.tests && node.tests.length > 0 && (
                    <div className="mt-4">
                      <Field label="Model Tests">
                        <TestChips tests={node.tests} />
                      </Field>
                    </div>
                  )}
                </Section>
                <Section title={`Columns (${Object.keys(node.columns).length})`}>
                  <ColumnsTable columns={node.columns} wide />
                </Section>
              </div>
            )}

            {tab === 'code' && (
              <Section title={codeKind === 'compiled' ? 'Compiled SQL' : 'Raw SQL'}>
                <div className="mb-2 inline-flex rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
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
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
