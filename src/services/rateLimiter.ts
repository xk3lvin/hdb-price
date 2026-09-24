/**
 * Rate Limiter for data.gov.sg API
 * Guardrail: 4 calls per 10 seconds keyless.
 * We enforce a conservative limit of 3 calls per 10s window to avoid HTTP 429.
 */

type RequestQueueItem<T> = {
  task: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests = 3; // Strict safe threshold under 4 calls/10s
  private readonly windowMs = 10500; // 10.5 seconds buffer
  private queue: RequestQueueItem<unknown>[] = [];
  private isProcessing = false;
  private listeners: Array<(state: { activeCount: number; queuedCount: number; nextSlotInMs: number }) => void> = [];

  public subscribe(listener: (state: { activeCount: number; queuedCount: number; nextSlotInMs: number }) => void) {
    this.listeners.push(listener);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const now = Date.now();
    this.cleanup(now);
    const activeCount = this.timestamps.length;
    const queuedCount = this.queue.length;
    const oldest = this.timestamps[0];
    const nextSlotInMs = oldest ? Math.max(0, oldest + this.windowMs - now) : 0;

    for (const listener of this.listeners) {
      listener({ activeCount, queuedCount, nextSlotInMs });
    }
  }

  private cleanup(now: number) {
    this.timestamps = this.timestamps.filter(t => now - t < this.windowMs);
  }

  public async schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: task as () => Promise<unknown>,
        resolve: resolve as (val: unknown) => void,
        reject,
      });
      this.notify();
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      this.cleanup(now);

      if (this.timestamps.length < this.maxRequests) {
        const item = this.queue.shift();
        if (item) {
          this.timestamps.push(Date.now());
          this.notify();
          // Execute task asynchronously
          item.task()
            .then(item.resolve)
            .catch(item.reject);
        }
      } else {
        // Wait until earliest timestamp expires
        const earliest = this.timestamps[0];
        const waitTime = Math.max(100, earliest + this.windowMs - Date.now() + 50);
        this.notify();
        await new Promise(r => setTimeout(r, waitTime));
      }
    }

    this.isProcessing = false;
    this.notify();
  }
}

export const rateLimiter = new RateLimiter();
