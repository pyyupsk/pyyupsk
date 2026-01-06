type LogLevel = "info" | "warn" | "error" | "success";

interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
}

const EMOJI_MAP: Record<LogLevel, string> = {
  info: "📖",
  warn: "⚠️",
  error: "❌",
  success: "✅",
};

export function createLogger(): Logger {
  return {
    info(message: string): void {
      console.log(`${EMOJI_MAP.info} ${message}`);
    },
    warn(message: string): void {
      console.warn(`${EMOJI_MAP.warn} ${message}`);
    },
    error(message: string): void {
      console.error(`${EMOJI_MAP.error} ${message}`);
    },
    success(message: string): void {
      console.log(`${EMOJI_MAP.success} ${message}`);
    },
  };
}

export const logger = createLogger();
