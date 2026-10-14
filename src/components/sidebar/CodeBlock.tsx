import { useMemo, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql';
import { Check, Copy } from 'lucide-react';

/** Above this size, highlight only the head of the SQL; copying still gives the full text. */
const MAX_HIGHLIGHT_CHARS = 20000;

export function CopyButton({ text, title = 'Copy' }: { text: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function CodeBlock({ code, className = '' }: { code: string; className?: string }) {
  const html = useMemo(() => {
    const shown =
      code.length > MAX_HIGHLIGHT_CHARS
        ? `${code.slice(0, MAX_HIGHLIGHT_CHARS)}\n\n-- ... (SQL truncated for performance, full content available via copy button)`
        : code;
    return Prism.highlight(shown, Prism.languages.sql, 'sql');
  }, [code]);

  return (
    <div className={`relative rounded-md border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="absolute top-1 right-1">
        <CopyButton text={code} />
      </div>
      <pre className="code-block overflow-auto p-3 pr-8 text-xs leading-relaxed">
        <code className="language-sql" dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
