import path from "node:path";
import Parser from "rss-parser";
import { atomicWrite, safeRead, validateFileExists } from "./lib/file-utils";
import { logger } from "./lib/logger";
import { withRetry } from "./lib/retry";

// Configuration
const RSS_URL = "https://fasu.dev/rss.xml";
const README_PATH = path.join(process.cwd(), "README.md");
const MAX_POSTS = 5;
const START_MARKER = "<!-- START_WRITINGS_TEMPLATE -->";
const END_MARKER = "<!-- END_WRITINGS_TEMPLATE -->";

interface RSSFeed {
  items: {
    title: string;
    link: string;
    pubDate: string;
    isoDate: string;
  }[];
}

async function fetchWritingsPosts(): Promise<RSSFeed["items"]> {
  logger.info("Fetching RSS feed...");

  const parser = new Parser<RSSFeed>();

  const feed = await withRetry(
    async () => {
      const result = (await parser.parseURL(RSS_URL)) as RSSFeed;

      if (!result.items || !Array.isArray(result.items)) {
        throw new Error(
          "Invalid RSS feed response: missing or invalid items array",
        );
      }

      return result;
    },
    {
      maxRetries: 3,
      baseDelay: 1000,
      onRetry: (attempt, error, nextDelay) => {
        logger.warn(
          `RSS fetch attempt ${attempt} failed: ${error.message}. Retrying in ${nextDelay}ms...`,
        );
      },
    },
  );

  const writingsPosts = feed.items
    .filter((item) => item.link?.includes("/writings/"))
    .map((item) => ({
      ...item,
      title: item.title || "",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
    }))
    // Sort by publication date (newest first)
    .sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
    )
    .slice(0, MAX_POSTS);

  return writingsPosts;
}

async function main(): Promise<void> {
  logger.info("Starting writings update...");

  await validateFileExists(README_PATH);

  const posts = await fetchWritingsPosts();
  console.log(`📚 Found ${posts.length} recent writings posts`);

  if (posts.length === 0) {
    logger.warn("No writings posts found in RSS feed");
    logger.info(
      "Check that the RSS feed contains posts with /writings/ in the URL",
    );
    process.exit(0);
  }

  logger.info("Reading README.md...");
  const readmeContent = await safeRead(README_PATH);

  const startIndex = readmeContent.indexOf(START_MARKER);
  const endIndex = readmeContent.indexOf(END_MARKER);

  if (startIndex === -1 || endIndex === -1) {
    logger.error("Template markers not found in README.md");
    logger.info("Make sure your README contains:");
    logger.info(START_MARKER);
    logger.info(END_MARKER);
    process.exit(1);
  }

  if (startIndex >= endIndex) {
    logger.error("Template markers are in wrong order in README.md");
    logger.info("Ensure START marker appears before END marker");
    process.exit(1);
  }

  const postsContent = posts
    .map((post) => {
      // Clean the link - ensure it doesn't have double slashes except after protocol
      const cleanLink = post.link.replaceAll(/([^:])\/\//g, "$1/");
      return `- **[${post.title}](${cleanLink})**`;
    })
    .join("\n");

  const newContent = `${START_MARKER}\n\n${postsContent}\n${END_MARKER}`;

  const currentSection = readmeContent.substring(
    startIndex,
    endIndex + END_MARKER.length,
  );
  if (currentSection === newContent) {
    logger.success("Writings are already up to date");
    process.exit(0);
  }

  const updatedContent =
    readmeContent.substring(0, startIndex) +
    newContent +
    readmeContent.substring(endIndex + END_MARKER.length);

  logger.info("Writing updated README.md...");
  await atomicWrite(README_PATH, updatedContent);
  logger.success("README.md updated successfully with latest writings");
}

main().catch((error: unknown) => { // NOSONAR
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error(`Failed to update writings: ${errorMessage}`);

  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack);
  }

  logger.info("To resolve this issue:");
  logger.info("1. Check your internet connection");
  logger.info(`2. Verify the RSS feed is accessible: ${RSS_URL}`);
  logger.info("3. Ensure README.md exists with proper template markers");
  logger.info("4. Run the script from the repository root directory");

  process.exit(1);
});
