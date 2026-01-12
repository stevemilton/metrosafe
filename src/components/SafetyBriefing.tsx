import ReactMarkdown from 'react-markdown';

interface SafetyBriefingProps {
  briefing: string | null;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

export function SafetyBriefing({ briefing, isLoading, onRegenerate }: SafetyBriefingProps) {
  const handleCopy = async () => {
    if (briefing) {
      await navigator.clipboard.writeText(briefing);
      alert('Report copied to clipboard!');
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 border-3 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="text-lg">Generating safety briefing...</p>
        </div>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-3/4"></div>
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-1/2"></div>
          <div className="h-4 bg-[var(--color-surface-elevated)] rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="text-[var(--color-text-muted)]">
          Search for a location to generate an AI safety briefing
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">AI Safety Briefing</h3>
        <div className="flex gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors text-sm"
            >
              Regenerate
            </button>
          )}
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors text-sm"
          >
            Copy Report
          </button>
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-[var(--color-text)]">{children}</h1>,
            h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2 text-[var(--color-text)]">{children}</h2>,
            h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2 text-[var(--color-text)]">{children}</h3>,
            p: ({ children }) => <p className="mb-3 text-[var(--color-text-muted)] leading-relaxed">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-[var(--color-text-muted)]">{children}</ul>,
            li: ({ children }) => <li className="ml-2">{children}</li>,
            strong: ({ children }) => <strong className="text-[var(--color-text)] font-semibold">{children}</strong>,
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                {children}
              </a>
            ),
          }}
        >
          {briefing}
        </ReactMarkdown>
      </div>
    </div>
  );
}
