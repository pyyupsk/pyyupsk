import path from "node:path";

const RSS_URL = "https://fasu.dev/rss.xml";
const README_PATH = path.join(process.cwd(), "README.md");
const MAX_POSTS = 5; // Number of latest posts to display

interface BlogPost {
  title: string;
  link: string;
  pubDate: string;
}

function extractField(content: string, pattern: RegExp): string {
  const match = pattern.exec(content);
  return match?.[1] ?? "";
}

function parseRSSItem(itemContent: string): BlogPost | null {
  const title = extractField(
    itemContent,
    /<title><!\[CDATA\[(.*?)\]\]><\/title>/,
  );
  const link = extractField(itemContent, /<link>(.*?)<\/link>/);
  const pubDate = extractField(itemContent, /<pubDate>(.*?)<\/pubDate>/);

  // Only include posts from /writings/ path
  if (!title || !link?.includes("/writings/")) {
    return null;
  }

  return {
    title,
    link,
    pubDate: pubDate || new Date().toISOString(),
  };
}

function parseRSSItems(rssText: string): BlogPost[] {
  const posts: BlogPost[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;

  let match = itemRegex.exec(rssText);
  while (match !== null) {
    const itemContent = match[1];
    if (itemContent) {
      const post = parseRSSItem(itemContent);
      if (post) {
        posts.push(post);
      }
    }
    match = itemRegex.exec(rssText);
  }

  return posts;
}

async function fetchRSSFeed(): Promise<BlogPost[]> {
  try {
    console.log("🌐 Fetching RSS feed...");
    const response = await fetch(RSS_URL);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch RSS: ${response.status} ${response.statusText}`,
      );
    }

    const rssText = await response.text();
    const posts = parseRSSItems(rssText);

    // Sort by publication date (newest first)
    posts.sort(
      (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
    );

    return posts.slice(0, MAX_POSTS);
  } catch (error) {
    console.error("❌ Error fetching RSS feed:", error);
    throw error;
  }
}

(async () => {
  try {
    console.log("📝 Starting writings update...");

    // Fetch latest posts from RSS
    const posts = await fetchRSSFeed();
    console.log(`📚 Found ${posts.length} recent posts`);

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
        const cleanLink = post.link.replace(/([^:])\/\//g, "$1/");
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
      return;
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
})();
