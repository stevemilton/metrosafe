import type { CrimeSummary } from '../types';
import { readSettings, ensureSettings } from '../db';
import { logger } from '../utils/logger';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const SYSTEM_PROMPT = `You are a Safety Analyst specializing in urban crime data interpretation for London, UK. Your role is to provide clear, actionable safety briefings based on official police crime statistics.

CONTEXT:
- You are analyzing crime data from data.police.uk (official UK government source)
- Data covers Greater London boroughs
- Your audience is residents, visitors, or people considering moving to the analyzed area

OUTPUT REQUIREMENTS:
1. **Overall Safety Assessment**: Classify the area as "Low Risk", "Moderate Risk", or "High Risk"
2. **Top Crime Categories**: Explain the 3 most common crimes in plain language
3. **Temporal Patterns**: Identify high-risk times if data suggests patterns
4. **Location-Specific Advice**: Recommend safe/risky streets based on hotspot data
5. **Positive Notes**: Highlight what the area does well

TONE: Balanced and factual (not alarmist or overly reassuring)
FORMAT: Use markdown with clear headings, bullet points for recommendations
CONSTRAINTS: Never fabricate statistics, avoid fear-mongering language`;

function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatSummaryForAI(location: string, summary: CrimeSummary): string {
  const categoryLines = Object.entries(summary.categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([category, count]) => `- ${formatCategoryName(category)}: ${count}`)
    .join('\n');

  const streetLines = summary.topStreets
    .map(({ street, count }) => `- ${street}: ${count} incidents`)
    .join('\n');

  return `
Location: ${location}
Total Incidents: ${summary.totalCrimes}
Date Range: ${summary.dateRange}

Crime Categories:
${categoryLines}

Hotspot Streets:
${streetLines}

Generate a concise safety briefing for this area.
`.trim();
}

export async function generateSafetyBriefing(
  location: string,
  summary: CrimeSummary
): Promise<string> {
  const settings = await readSettings() ?? await ensureSettings();
  
  if (!settings.geminiApiKey) {
    return `## AI Analysis Unavailable

To enable AI-generated safety briefings:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Open Settings (gear icon)
3. Paste your key and click "Save"

Your key is stored locally and never shared.`;
  }

  const prompt = formatSummaryForAI(location, summary);

  try {
    const response = await fetch(`${GEMINI_API_BASE}?key=${settings.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: SYSTEM_PROMPT }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will analyze crime data and provide balanced, factual safety briefings for London locations.' }],
          },
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate briefing.';
  } catch (error) {
    logger.error('Gemini API error:', error);
    return `## Error Generating Briefing

There was an error connecting to the AI service. Please check your API key in Settings and try again.

Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`${GEMINI_API_BASE}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 10 },
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
