import { useState, useMemo } from 'react';

interface SafetyBriefingProps {
  briefing: string | null;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

interface Section {
  title: string;
  content: string;
  icon: string;
}

function parseIntoSections(markdown: string): Section[] {
  const sections: Section[] = [];
  const lines = markdown.split('\n');
  let currentTitle = '';
  let currentContent: string[] = [];

  const getIcon = (title: string): string => {
    const lower = title.toLowerCase();
    if (lower.includes('overview') || lower.includes('summary') || lower.includes('briefing')) return '📋';
    if (lower.includes('safety') || lower.includes('assessment') || lower.includes('risk')) return '🛡️';
    if (lower.includes('crime') || lower.includes('categories') || lower.includes('types')) return '📊';
    if (lower.includes('time') || lower.includes('temporal') || lower.includes('pattern')) return '🕐';
    if (lower.includes('location') || lower.includes('area') || lower.includes('advice')) return '📍';
    if (lower.includes('positive') || lower.includes('recommendation') || lower.includes('tip')) return '✅';
    if (lower.includes('hotspot') || lower.includes('high-risk')) return '⚠️';
    return '📌';
  };

  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h2Match || h3Match) {
      if (currentTitle && currentContent.length > 0) {
        sections.push({
          title: currentTitle,
          content: currentContent.join('\n').trim(),
          icon: getIcon(currentTitle),
        });
      }
      currentTitle = (h2Match || h3Match)![1];
      currentContent = [];
    } else if (currentTitle) {
      currentContent.push(line);
    } else if (!line.startsWith('#') && line.trim()) {
      // Content before first header
      currentContent.push(line);
    }
  }

  // Add last section
  if (currentTitle && currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
      icon: getIcon(currentTitle),
    });
  }

  // If no sections found, create one from the whole content
  if (sections.length === 0 && markdown.trim()) {
    sections.push({
      title: 'Safety Overview',
      content: markdown,
      icon: '📋',
    });
  }

  return sections;
}

function detectRiskLevel(text: string): 'low' | 'moderate' | 'high' {
  const lower = text.toLowerCase();
  if (lower.includes('high risk') || lower.includes('significant risk') || lower.includes('dangerous')) {
    return 'high';
  }
  if (lower.includes('low risk') || lower.includes('relatively safe') || lower.includes('safe area')) {
    return 'low';
  }
  return 'moderate';
}

function formatContent(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- /gm, '• ')
    .replace(/\n/g, '<br/>');
}

function CollapsibleSection({ section, isOpen, onToggle }: { section: Section; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="collapsible">
      <button onClick={onToggle} className="collapsible-trigger">
        <div className="flex items-center">
          <span className="collapsible-icon">{section.icon}</span>
          <span className="collapsible-title">{section.title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          className="collapsible-content animate-fade-in"
          dangerouslySetInnerHTML={{ __html: formatContent(section.content) }}
        />
      )}
    </div>
  );
}

export function SafetyBriefing({ briefing, isLoading, onRegenerate }: SafetyBriefingProps) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0, 1]));
  const [copied, setCopied] = useState(false);

  const sections = useMemo(() => (briefing ? parseIntoSections(briefing) : []), [briefing]);
  const riskLevel = useMemo(() => (briefing ? detectRiskLevel(briefing) : 'moderate'), [briefing]);

  const handleCopy = async () => {
    if (briefing) {
      await navigator.clipboard.writeText(briefing);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleSection = (index: number) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => setOpenSections(new Set(sections.map((_, i) => i)));
  const collapseAll = () => setOpenSections(new Set());

  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text)]">Generating Safety Briefing</h3>
            <p className="text-sm text-[var(--color-text-muted)]">AI is analyzing the crime data...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-[var(--color-surface-secondary)] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="card p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-[var(--color-surface-secondary)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-2">AI Safety Briefing</h3>
        <p className="text-[var(--color-text-muted)] text-sm">
          Search for a location to generate an AI-powered safety analysis
        </p>
      </div>
    );
  }

  const riskConfig = {
    low: { label: 'Low Risk', class: 'badge-success' },
    moderate: { label: 'Moderate Risk', class: 'badge-warning' },
    high: { label: 'High Risk', class: 'badge-danger' },
  };

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-[var(--color-text)]">AI Safety Briefing</h3>
                <span className={`badge ${riskConfig[riskLevel].class}`}>
                  {riskConfig[riskLevel].label}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {sections.length} sections • Powered by Gemini AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={collapseAll}
              className="btn btn-ghost text-sm"
            >
              Collapse
            </button>
            <button
              onClick={expandAll}
              className="btn btn-ghost text-sm"
            >
              Expand
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="btn btn-secondary text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            )}
            <button
              onClick={handleCopy}
              className="btn btn-primary text-sm"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 bg-[var(--color-surface-secondary)]/30">
        <div className="space-y-2">
          {sections.map((section, index) => (
            <CollapsibleSection
              key={index}
              section={section}
              isOpen={openSections.has(index)}
              onToggle={() => toggleSection(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
