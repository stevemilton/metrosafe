import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock IndexedDB for tests
const indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

vi.stubGlobal('indexedDB', indexedDB);

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn());

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
