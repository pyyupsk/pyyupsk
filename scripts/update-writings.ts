import path from "node:path";
import Parser from "rss-parser";

const RSS_URL = "https://fasu.dev/rss.xml";
const README_PATH = path.join(process.cwd(), "README.md");
const MAX_POSTS = 5; // Number of latest posts to display

type RSSFeed = {
  items: {
    title: string;
    link: string;
    pubDate: string;
    isoDate: string;
  }[];
};

async function fetchWritingsPosts(): Promise<RSSFeed["items"]> {
  try {
    console.log("🌐 Fetching RSS feed...");

    const parser = new Parser<RSSFeed>();
    const feed = (await parser.parseURL(RSS_URL)) as RSSFeed;

    // Filter posts from /writings/ path and map to our interface
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
      // Take only the latest posts
      .slice(0, MAX_POSTS);

    return writingsPosts;
  } catch (error) {
    console.error("❌ Error fetching RSS feed:", error);
    throw error;
  }
}

try {
  console.log("📝 Starting writings update...");

  // Fetch latest posts from RSS
  const posts = await fetchWritingsPosts();
  console.log(`📚 Found ${posts.length} recent writings posts`);

  // Read current README
  console.log("📖 Reading README.md...");
  const readmeFile = Bun.file(README_PATH);
  const readmeContent = await readmeFile.text();

  // Find the template markers
  const startMarker = "<!-- START_WRITINGS_TEMPLATE -->";
  const endMarker = "<!-- END_WRITINGS_TEMPLATE -->";

  const startIndex = readmeContent.indexOf(startMarker);
  const endIndex = readmeContent.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.error("❌ Template markers not found in README.md");
    console.log("Make sure your README contains:");
    console.log("<!-- START_WRITINGS_TEMPLATE -->");
    console.log("<!-- END_WRITINGS_TEMPLATE -->");
    process.exit(1);
  }

  // Generate new posts content
  const postsContent = posts
    .map((post) => {
      // Clean the link - ensure it doesn't have double slashes except after protocol
      const cleanLink = post.link.replaceAll(/([^:])\/\//g, "$1/");
      return `- **[${post.title}](${cleanLink})**`;
    })
    .join("\n");

  const newContent = `${startMarker}\n${postsContent}\n${endMarker}`;

  // Check if content needs updating
  const currentSection = readmeContent.substring(
    startIndex,
    endIndex + endMarker.length,
  );
  if (currentSection === newContent) {
    console.log("✅ Writings are already up to date");
    process.exit(0);
  }

  // Update README
  const updatedContent =
    readmeContent.substring(0, startIndex) +
    newContent +
    readmeContent.substring(endIndex + endMarker.length);

  console.log("✏️ Writing updated README.md...");
  await Bun.write(README_PATH, updatedContent);
  console.log("✅ README.md updated successfully with latest writings");
} catch (error) {
  console.error("❌ Error updating writings:", error);
  process.exit(1);
}
