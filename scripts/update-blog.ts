import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { desc, eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { blog } from '../drizzle/schema';

const readmePath = path.join(process.cwd(), 'README.md');
const readme = fs.readFileSync(readmePath, 'utf-8');

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const run = async () => {
  try {
    console.log('Fetching posts from the database...');
    const [posts, startIndex, endIndex] = await Promise.all([
      db
        .select()
        .from(blog)
        .orderBy(desc(blog.createdAt))
        .where(eq(blog.status, 'published'))
        .limit(5),
      Promise.resolve(readme.indexOf('<!-- START_TEMPLATE -->')),
      Promise.resolve(readme.indexOf('<!-- END_TEMPLATE -->')),
    ]);

    console.log({ posts, startIndex, endIndex });

    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Template not found in README.md');
    }

    console.log('Extracting current posts from README.md...');
    const currentPosts =
      readme
        .substring(startIndex + '<!-- START_TEMPLATE -->'.length + 1, endIndex - 1)
        .match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g) || [];

    console.log({ currentPosts });

    if (
      currentPosts.length === posts.length &&
      currentPosts.every((id) => posts.some((post) => post.id === id))
    ) {
      console.log('No changes needed');
      return;
    }

    console.log('Preparing new posts string for README.md...');
    const postsString = [
      '<!-- START_TEMPLATE -->',
      ...posts.map((post) => `- **[${post.title}](https://fasu.dev/blog/${post.id})**`),
    ].join('\n');

    console.log('Updating README.md...');
    const newReadme = [readme.slice(0, startIndex), postsString, readme.slice(endIndex)].join('\n');

    fs.writeFileSync(readmePath, newReadme);
    console.log('README.md updated successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
};

run();
