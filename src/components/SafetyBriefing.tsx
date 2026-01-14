import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

interface SafetyBriefingProps {
  briefing: string | null;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

interface BriefingSection {
  title: string;
  content: string;
  icon: string;
  defaultOpen: boolean;
}

function parseRiskLevel(briefing: string): 'low' | 'moderate' | 'high' {
  const lowerBriefing = briefing.toLowerCase();
  if (lowerBriefing.includes('high risk') || lowerBriefing.includes('high-risk')) return 'high';
  if (lowerBriefing.includes('low risk') || lowerBriefing.includes('low-risk')) return 'low';
  return 'moderate';
}

function parseBriefingSections(briefing: string): BriefingSection[] {
  const sections: BriefingSection[] = [];
  const lines = briefing.split('\n');
  let currentSection: BriefingSection | null = null;
  let currentContent: string[] = [];

  const sectionIcons: Record<string, string> = {
    'safety': '🛡️',
    'assessment': '📊',
    'crime': '📋',
    'categories': '📋',
    'temporal': '🕐',
    'pattern': '🕐',
    'location': '📍',
    'advice': '💡',
    'positive': '✅',
    'recommendation': '💡',
    'notes': '📝',
  };

  const getIcon = (title: string): string => {
    const lowerTitle = title.toLowerCase();
    for (const [key, icon] of Object.entries(sectionIcons)) {
      if (lowerTitle.includes(key)) return icon;
    }
    return '📌';
  };

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+\d*\.?\s*(.+)/);
    if (headerMatch) {
      if (currentSection) {
        currentSection.content = currentContent.join('\n').trim();
        if (currentSection.content) {
          sections.push(currentSection);
        }
      }
      const title = headerMatch[1].replace(/\*\*/g, '').trim();
      currentSection = {
        title,
        content: '',
        icon: getIcon(title),
        defaultOpen: sections.length < 2,
      };
      currentContent = [];
    } else if (currentSection) {
      currentContent.push(line);
    } else {
      // Content before first header - add as intro
      if (line.trim() && !currentSection) {
        currentSection = {
          title: 'Overview',
          content: '',
          icon: '📊',
          defaultOpen: true,
        };
        currentContent.push(line);
      }
    }
  }

  if (currentSection) {
    currentSection.content = currentContent.join('\n').trim();
    if (currentSection.content) {
      sections.push(currentSection);
    }
  }

  return sections.length > 0 ? sections : [{
    title: 'Safety Analysis',
    content: briefing,
    icon: '🛡️',
    defaultOpen: true,
  }];
}

function CollapsibleSection({ section, isOpen, onToggle }: {
  section: BriefingSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-[var(--color-surface)]/50 transition-all hover:border-[var(--color-border-light)]">
      <button
        onClick={onToggle}
        className="w-full collapsible-header text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{section.icon}</span>
          <span className="font-semibold text-[var(--color-text)]">{section.title}</span>
        </div>
        <svg
          className={`w-5 h-5 text-[var(--color-text-muted)] collapsible-icon ${isOpen ? 'open' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className="collapsible-content"
        style={{ maxHeight: isOpen ? '1000px' : '0' }}
      >
        <div className="px-4 pb-4 pt-0">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="mb-3 text-[var(--color-text-muted)] leading-relaxed text-sm">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="space-y-2 mb-3">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                    <span className="text-[var(--color-primary)] mt-1">•</span>
                    <span>{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="text-[var(--color-text)] font-semibold">{children}</strong>
                ),
              }}
            >
              {section.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SafetyBriefing({ briefing, isLoading, onRegenerate }: SafetyBriefingProps) {
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0, 1]));
  const [copied, setCopied] = useState(false);

  const sections = useMemo(() => {
    if (!briefing) return [];
    return parseBriefingSections(briefing);
  }, [briefing]);

  const riskLevel = useMemo(() => {
    if (!briefing) return 'moderate';
    return parseRiskLevel(briefing);
  }, [briefing]);

  const handleCopy = async () => {
    if (briefing) {
      await navigator.clipboard.writeText(briefing);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const toggleSection = (index: number) => {
    setOpenSections(prev => {
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
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Generating Safety Analysis</h3>
            <p className="text-sm text-[var(--color-text-muted)]">AI is analyzing crime patterns...</p>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🤖</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">AI Safety Analysis</h3>
        <p className="text-[var(--color-text-muted)] text-sm max-w-md mx-auto">
          Search for a location to receive an AI-powered safety briefing with actionable insights and recommendations.
        </p>
      </div>
    );
  }

  const riskConfig = {
    low: { label: 'Low Risk', class: 'risk-low' },
    moderate: { label: 'Moderate Risk', class: 'risk-moderate' },
    high: { label: 'High Risk', class: 'risk-high' },
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-lg font-semibold">AI Safety Briefing</h3>
                <span className={`risk-badge ${riskConfig[riskLevel].class}`}>
                  {riskConfig[riskLevel].label}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)]">
                {sections.length} sections • Powered by Gemini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={collapseAll}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Collapse
            </button>
            <button
              onClick={expandAll}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Expand
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                ↻ Regenerate
              </button>
            )}
            <button
              onClick={handleCopy}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6 space-y-3">
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
