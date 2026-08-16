export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'warn' | 'error';
}

type LogListener = (entry: LogEntry) => void;

class FrontendLogger {
  private listeners: LogListener[] = [];
  private logHistory: LogEntry[] = [];

  constructor() {
    this.info('[SYSTEM] Frontend logging subsystem initialized.');
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  public clearHistory(): void {
    this.logHistory = [];
  }

  public log(message: string, type: 'info' | 'warn' | 'error' = 'info'): void {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const entry: LogEntry = {
      timestamp,
      message,
      type,
    };
    this.logHistory.push(entry);
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch {
        // silent
      }
    });
  }

  public info(message: string): void {
    this.log(message, 'info');
  }

  public warn(message: string): void {
    this.log(message, 'warn');
  }

  public error(message: string): void {
    this.log(message, 'error');
  }
}

export const frontendLogger = new FrontendLogger();
