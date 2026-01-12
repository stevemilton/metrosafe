import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { testApiKey } from '../services/gemini';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  const [apiKey, setApiKey] = useState(settings?.geminiApiKey || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testApiKey(apiKey);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings({ geminiApiKey: apiKey || null });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md animate-fade-in">
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        <div className="space-y-6">
          {/* Gemini API Key */}
          <div>
            <label className="block text-sm font-medium mb-2">Gemini API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
              }}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Get a free key from{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {/* Test Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleTest}
              disabled={!apiKey || isTesting}
              className="px-4 py-2 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult !== null && (
              <span className={testResult ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}>
                {testResult ? '✓ Connection successful' : '✗ Invalid API key'}
              </span>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Theme</span>
            <button
              onClick={() => updateSettings({ theme: settings?.theme === 'dark' ? 'light' : 'dark' })}
              className="px-4 py-2 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors"
            >
              {settings?.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>

          {/* Heatmap Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Show Heatmap</span>
            <button
              onClick={() => updateSettings({ showHeatmap: !settings?.showHeatmap })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings?.showHeatmap ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings?.showHeatmap ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[var(--color-surface-elevated)] hover:bg-[var(--color-border)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
