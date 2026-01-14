const isDev = import.meta.env.DEV;

export const logger = {
  error: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.error(`[MetroSafe] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.warn(`[MetroSafe] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]): void => {
    if (isDev) {
      console.info(`[MetroSafe] ${message}`, ...args);
    }
  },
};
