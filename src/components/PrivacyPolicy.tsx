interface PrivacyPolicyProps {
  onClose: () => void;
}

export function PrivacyPolicy({ onClose }: PrivacyPolicyProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8 flex items-start justify-center">
        <div className="glass rounded-2xl p-8 max-w-3xl w-full animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              aria-label="Close privacy policy"
            >
              ✕
            </button>
          </div>

          <div className="prose prose-invert max-w-none space-y-6 text-[var(--color-text-muted)]">
            <p className="text-sm">Last updated: January 2026</p>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Overview</h2>
              <p>
                MetroSafe is a privacy-first application. We are committed to protecting your privacy
                and being transparent about our data practices. This policy explains how we handle
                information when you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Data We Collect</h2>
              <p><strong className="text-[var(--color-text)]">We do not collect any personal data.</strong></p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>No user accounts or registration required</li>
                <li>No cookies for tracking purposes</li>
                <li>No analytics or usage tracking</li>
                <li>No data sent to our servers (we don't have any)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Local Storage</h2>
              <p>
                MetroSafe stores data locally in your browser using IndexedDB:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li><strong className="text-[var(--color-text)]">Search history:</strong> Your recent location searches</li>
                <li><strong className="text-[var(--color-text)]">Cached crime data:</strong> Previously fetched crime statistics</li>
                <li><strong className="text-[var(--color-text)]">Settings:</strong> Your theme preference and API key</li>
              </ul>
              <p className="mt-2">
                This data never leaves your device and can be cleared at any time through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Third-Party Services</h2>
              <p>MetroSafe connects to the following external services:</p>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li>
                  <strong className="text-[var(--color-text)]">UK Police Data API (data.police.uk)</strong>
                  <br />
                  <span className="text-sm">Official UK government crime data. Subject to their{' '}
                    <a href="https://data.police.uk/about/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                      terms of use
                    </a>.
                  </span>
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">OpenStreetMap Nominatim</strong>
                  <br />
                  <span className="text-sm">For location search. Subject to their{' '}
                    <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                      privacy policy
                    </a>.
                  </span>
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">Google Gemini API (optional)</strong>
                  <br />
                  <span className="text-sm">For AI-powered safety analysis. Requires your own API key. Subject to{' '}
                    <a href="https://ai.google.dev/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                      Google's terms
                    </a>.
                  </span>
                </li>
                <li>
                  <strong className="text-[var(--color-text)]">OpenStreetMap Tiles</strong>
                  <br />
                  <span className="text-sm">For map display. Subject to their{' '}
                    <a href="https://wiki.osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                      privacy policy
                    </a>.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Your API Key</h2>
              <p>
                If you provide a Google Gemini API key, it is stored locally in your browser's IndexedDB.
                The key is sent directly from your browser to Google's servers when generating safety briefings.
                We never see, store, or transmit your API key through any server we control.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Data Retention</h2>
              <p>
                All data is stored locally in your browser. You can clear this data at any time by:
              </p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Clearing your browser's site data for this domain</li>
                <li>Using your browser's "Clear browsing data" feature</li>
                <li>Using private/incognito mode (data is cleared on close)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Contact</h2>
              <p>
                If you have questions about this privacy policy, please open an issue on our{' '}
                <a href="https://github.com/stevemilton/metrosafe" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">
                  GitHub repository
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify users of any
                material changes by updating the "Last updated" date at the top of this policy.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface)]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
