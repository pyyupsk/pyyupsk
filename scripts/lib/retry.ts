import { logger } from "./logger";

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelay = options.baseDelay ?? DEFAULT_BASE_DELAY;
  const onRetry = options.onRetry;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const nextDelay = baseDelay * 2 ** attempt;

        if (onRetry) {
          onRetry(attempt + 1, lastError, nextDelay);
        } else {
          logger.warn(
            `Attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}. Retrying in ${nextDelay}ms...`,
          );
        }

        await delay(nextDelay);
      }
    }
  }

  throw lastError;
}
