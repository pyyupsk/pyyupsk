import Parser from "rss-parser";
import { logger } from "./lib/logger";
import { withRetry } from "./lib/retry";

interface HealthCheckEndpoint {
  name: string;
  url: string;
  type: "http" | "rss";
  timeout?: number;
}

interface HealthCheckResult {
  endpoint: HealthCheckEndpoint;
  status: "healthy" | "unhealthy";
  statusCode?: number;
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface HealthCheckReport {
  overallStatus: "healthy" | "unhealthy";
  results: HealthCheckResult[];
  totalTime: number;
  healthyCount: number;
  unhealthyCount: number;
}

// Configuration - endpoints to check
const HEALTH_CHECK_ENDPOINTS: HealthCheckEndpoint[] = [
  {
    name: "RSS Feed",
    url: "https://fasu.dev/rss.xml",
    type: "rss",
    timeout: 30000,
  },
  {
    name: "GitHub Stats",
    url: "https://awesome-github-stats.azurewebsites.net/user-stats/pyyupsk",
    type: "http",
    timeout: 30000,
  },
  {
    name: "Streak Stats",
    url: "https://github-readme-streak-stats-eight.vercel.app?user=pyyupsk",
    type: "http",
    timeout: 30000,
  },
  {
    name: "Activity Graph",
    url: "https://github-readme-activity-graph.vercel.app/graph?username=pyyupsk",
    type: "http",
    timeout: 30000,
  },
];

async function checkHttpEndpoint(
  endpoint: HealthCheckEndpoint,
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const response = await withRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          endpoint.timeout ?? 30000,
        );

        try {
          const res = await fetch(endpoint.url, {
            method: "GET",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return res;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
      },
    );

    const responseTime = Date.now() - startTime;
    const isHealthy = response.ok;

    return {
      endpoint,
      status: isHealthy ? "healthy" : "unhealthy",
      statusCode: response.status,
      responseTime,
      timestamp: new Date().toISOString(),
      error: isHealthy ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      endpoint,
      status: "unhealthy",
      responseTime,
      timestamp: new Date().toISOString(),
      error: errorMessage,
    };
  }
}

async function checkRssEndpoint(
  endpoint: HealthCheckEndpoint,
): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const parser = new Parser();

    await withRetry(
      async () => {
        const feed = await parser.parseURL(endpoint.url);

        if (!feed.items || feed.items.length === 0) {
          throw new Error("RSS feed is empty or has no items");
        }

        return feed;
      },
      {
        maxRetries: 2,
        baseDelay: 1000,
      },
    );

    const responseTime = Date.now() - startTime;

    return {
      endpoint,
      status: "healthy",
      statusCode: 200,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      endpoint,
      status: "unhealthy",
      responseTime,
      timestamp: new Date().toISOString(),
      error: errorMessage,
    };
  }
}

async function checkEndpoint(
  endpoint: HealthCheckEndpoint,
): Promise<HealthCheckResult> {
  if (endpoint.type === "rss") {
    return checkRssEndpoint(endpoint);
  }
  return checkHttpEndpoint(endpoint);
}

async function runHealthChecks(
  endpoints: HealthCheckEndpoint[],
): Promise<HealthCheckReport> {
  const startTime = Date.now();
  const results: HealthCheckResult[] = [];

  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push(result);

    const statusEmoji = result.status === "healthy" ? "✅" : "❌";
    const statusText =
      result.status === "healthy"
        ? `healthy (${result.responseTime}ms)`
        : `unhealthy: ${result.error}`;
    console.log(`${statusEmoji} ${endpoint.name}: ${statusText}`);
  }

  const totalTime = Date.now() - startTime;
  const healthyCount = results.filter((r) => r.status === "healthy").length;
  const unhealthyCount = results.filter((r) => r.status === "unhealthy").length;

  return {
    overallStatus: unhealthyCount > 0 ? "unhealthy" : "healthy",
    results,
    totalTime,
    healthyCount,
    unhealthyCount,
  };
}

function printReport(report: HealthCheckReport): void {
  console.log("");
  console.log("📊 Health Check Report");
  console.log("======================");
  console.log(
    `Overall: ${report.overallStatus === "healthy" ? "✅ HEALTHY" : "❌ UNHEALTHY"}`,
  );
  console.log(`Checked: ${report.results.length} endpoints`);
  console.log(`Healthy: ${report.healthyCount}`);
  console.log(`Unhealthy: ${report.unhealthyCount}`);
  console.log(`Total time: ${report.totalTime}ms`);
}

async function main(): Promise<void> {
  console.log("🏥 Starting health check...\n");

  const report = await runHealthChecks(HEALTH_CHECK_ENDPOINTS);
  printReport(report);

  if (report.overallStatus === "unhealthy") {
    logger.error("One or more endpoints are unhealthy");
    process.exit(1);
  }

  logger.success("All endpoints are healthy");
  process.exit(0);
}

main().catch((error: unknown) => { // NOSONAR
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Health check failed: ${errorMessage}`);

  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack);
  }

  process.exit(1);
});
