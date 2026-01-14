import type { CrimeSummary } from '../types';
import { readSettings, ensureSettings } from '../db';
import { logger } from '../utils/logger';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

const SYSTEM_PROMPT = `You are a Safety Analyst specializing in interpreting official UK police street-level crime statistics for London, UK.

SOURCE CONSTRAINTS
- You must use ONLY the data provided in the user message (which is derived from data.police.uk).
- Do NOT use general knowledge about London, postcodes, boroughs, landmarks, or "typical" crime patterns.
- Do NOT introduce any street/place names that are not explicitly present in the input.

EVIDENCE RULE (HARD)
- Every factual claim must be directly supported by the provided input.
- If the input does not contain the information needed for a required section, write exactly: "Not available in provided data."
- Never invent statistics, rankings, trends, or comparisons.
- Do not infer temporal patterns (e.g., "evenings/weekends") unless the input includes a breakdown by time/day.

RISK RATING RULE (HARD)
- If a comparative baseline is not provided (e.g., borough average, London average, prior month), you must output:
  Overall Safety Assessment: "Moderate Risk (no comparative baseline provided)"
- Only output "Low Risk" or "High Risk" if the input includes an explicit baseline or threshold that justifies it.

HOTSPOT GUIDANCE RULE (HARD)
- You may describe "higher concentration locations" only using the provided hotspot list.
- Do NOT label streets as "safe". You may label entries as "higher concentration (from provided hotspot list)" only.

OUTPUT FORMAT (MARKDOWN)
Use exactly these headings in this order:
1. Overall Safety Assessment
2. Top Crime Categories
3. Temporal Patterns
4. Hotspot-Aware Guidance
5. Positive Notes
6. Data Quality Notes

STYLE
- Balanced, factual, concise.
- Bullet points for recommendations.
- No alarmist language.`;

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

  return `Analyze this area using ONLY the data below.

Location: ${location}
Total Incidents: ${summary.totalCrimes}
Date Range: ${summary.dateRange}

Crime Categories (count):
${categoryLines}

Hotspot Streets (incidents):
${streetLines}

Additional Data (optional):
- Comparative Baseline: Not provided
- Temporal Breakdown: Not provided

Generate a concise safety briefing. Follow the required headings and rules from the system prompt.`;
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
            parts: [{ text: 'I understand. I will analyze ONLY the provided data, never invent statistics or street names, use "Moderate Risk (no comparative baseline provided)" unless a baseline is given, and follow the exact heading structure specified.' }],
          },
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
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
