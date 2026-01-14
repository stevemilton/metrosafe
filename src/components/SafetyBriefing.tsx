import { useState, useMemo } from 'react';

interface SafetyBriefingProps {
  briefing: string | null;
  isLoading?: boolean;
  onRegenerate?: () => void;
  compact?: boolean;
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
      currentContent.push(line);
    }
  }

  if (currentTitle && currentContent.length > 0) {
    sections.push({
      title: currentTitle,
      content: currentContent.join('\n').trim(),
      icon: getIcon(currentTitle),
    });
  }

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
          className={`w-5 h-5 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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

export function SafetyBriefing({ briefing, isLoading, onRegenerate, compact }: SafetyBriefingProps) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0, 1]));
  const [copied, setCopied] = useState(false);
  const [showApiKeyInfo, setShowApiKeyInfo] = useState(false);

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

  // Loading state
  if (isLoading) {
    return (
      <div className={compact ? "space-y-4" : "card p-8 lg:p-10"}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center`}>
            <div className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin`} />
          </div>
          <div>
            <h3 className={`font-semibold text-[var(--color-text)] ${compact ? 'text-sm' : 'text-xl'}`}>Generating Briefing</h3>
            <p className={`text-[var(--color-text-muted)] ${compact ? 'text-xs' : ''}`}>AI is analyzing data...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className={`${compact ? 'h-14' : 'h-20'} bg-[var(--color-surface-secondary)] rounded-xl animate-pulse`} />
          ))}
        </div>
      </div>
    );
  }

  // Empty state - improved with better CTA
  if (!briefing) {
    // Check if API key exists in localStorage
    const hasApiKey = typeof window !== 'undefined' && localStorage.getItem('gemini_api_key');

    return (
      <div className={compact ? "text-center py-6" : "card p-12 text-center"}>
        <div className={`${compact ? 'w-12 h-12' : 'w-16 h-16'} rounded-xl bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 flex items-center justify-center mx-auto mb-4`}>
          <svg className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} text-[var(--color-primary)]`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>

        {hasApiKey ? (
          <>
            <h3 className={`font-semibold text-[var(--color-text)] ${compact ? 'text-sm mb-2' : 'text-xl mb-3'}`}>
              AI Safety Briefing
            </h3>
            <p className={`text-[var(--color-text-muted)] ${compact ? 'text-xs mb-4' : 'text-base mb-6'}`}>
              Search for a location to generate an AI-powered safety analysis
            </p>
          </>
        ) : (
          <>
            <h3 className={`font-semibold text-[var(--color-text)] ${compact ? 'text-sm mb-2' : 'text-xl mb-3'}`}>
              AI Briefing Not Enabled
            </h3>
            <p className={`text-[var(--color-text-muted)] ${compact ? 'text-xs mb-4 max-w-[200px] mx-auto' : 'text-base mb-6 max-w-sm mx-auto'}`}>
              Add a Gemini API key to unlock AI-powered safety insights for any London location
            </p>
            <div className={`flex ${compact ? 'flex-col gap-2' : 'justify-center gap-3'}`}>
              <button
                onClick={() => {
                  // Trigger settings modal - find and click the settings button
                  const settingsBtn = document.querySelector('[aria-label="Open settings"]') as HTMLButtonElement;
                  if (settingsBtn) settingsBtn.click();
                }}
                className={`btn btn-primary ${compact ? 'btn-sm w-full' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add API Key
              </button>
              <button
                onClick={() => setShowApiKeyInfo(!showApiKeyInfo)}
                className={`btn btn-secondary ${compact ? 'btn-sm w-full' : ''}`}
              >
                Learn More
              </button>
            </div>
            {showApiKeyInfo && (
              <div className={`mt-4 ${compact ? 'text-xs' : 'text-sm'} text-left bg-[var(--color-surface-secondary)] rounded-lg p-4`}>
                <p className="text-[var(--color-text-secondary)] mb-2">
                  <strong>How to get a Gemini API key:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[var(--color-text-muted)]">
                  <li>Visit <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">Google AI Studio</a></li>
                  <li>Sign in with your Google account</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it in Settings</li>
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  const riskConfig = {
    low: { label: 'Low Risk', class: 'badge-success' },
    moderate: { label: 'Moderate Risk', class: 'badge-warning' },
    high: { label: 'High Risk', class: 'badge-danger' },
  };

  // Compact mode for panel
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`badge ${riskConfig[riskLevel].class}`}>
              {riskConfig[riskLevel].label}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">
              {sections.length} sections
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <button onClick={onRegenerate} className="btn btn-ghost btn-sm p-1.5" title="Regenerate">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button onClick={handleCopy} className="btn btn-ghost btn-sm p-1.5" title={copied ? 'Copied!' : 'Copy'}>
              {copied ? (
                <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Compact Sections */}
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
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-6 lg:p-8 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-semibold text-[var(--color-text)]">AI Safety Briefing</h3>
                <span className={`badge ${riskConfig[riskLevel].class}`}>
                  {riskConfig[riskLevel].label}
                </span>
              </div>
              <p className="text-[var(--color-text-muted)] mt-1">
                {sections.length} sections • Powered by Gemini AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={collapseAll}
              className="btn btn-ghost btn-sm"
            >
              Collapse All
            </button>
            <button
              onClick={expandAll}
              className="btn btn-ghost btn-sm"
            >
              Expand All
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="btn btn-secondary btn-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </button>
            )}
            <button
              onClick={handleCopy}
              className="btn btn-primary btn-sm"
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
      <div className="p-6 lg:p-8 bg-[var(--color-surface-secondary)]/30">
        <div className="space-y-3">
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
