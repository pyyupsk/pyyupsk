import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { desc, eq, sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import fs from 'fs';
import path from 'path';

const readmePath = path.join(process.cwd(), 'README.md');
const readme = fs.readFileSync(readmePath, 'utf-8');

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client);

const postStatus = pgEnum('PostStatus', ['DRAFT', 'PUBLISHED', 'ARCHIVED']);

const post = pgTable(
    'post',
    {
        description: text(),
        id: text().primaryKey().notNull(),
        publishDate: timestamp({ mode: 'string', precision: 3 })
            .default(sql`CURRENT_TIMESTAMP`)
            .notNull(),
        status: postStatus().default('DRAFT').notNull(),
        title: varchar({ length: 255 }).notNull(),
    },
    (table) => {
        return {
            idIdx: index('post_id_idx').using('btree', table.id.asc().nullsLast()),
            publishDateIdx: index('post_publishDate_idx').using(
                'btree',
                table.publishDate.asc().nullsLast()
            ),
            statusIdx: index('post_status_idx').using('btree', table.status.asc().nullsLast()),
        };
    }
);

const run = async () => {
    const [posts, startIndex, endIndex] = await Promise.all([
        db
            .select()
            .from(post)
            .orderBy(desc(post.publishDate))
            .where(eq(post.status, 'PUBLISHED'))
            .limit(5),
        Promise.resolve(readme.indexOf('<!-- START_TEMPLATE -->')),
        Promise.resolve(readme.indexOf('<!-- END_TEMPLATE -->')),
    ]);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error('Template not found');
    }

    const currentPosts =
        readme
            .substring(startIndex + '<!-- START_TEMPLATE -->'.length + 1, endIndex - 1)
            .match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g) || [];

    if (currentPosts.length === posts.length && currentPosts.every((id) => id)) {
        console.log('No changes needed');
        return;
    }

    const postsString = [
        '<!-- START_TEMPLATE -->',
        ...posts.map((post) => `- **[${post.title}](https://pyyupsk.vercel.app/post/${post.id})**`),
    ].join('\n');

    const newReadme = [readme.slice(0, startIndex), postsString, readme.slice(endIndex)].join('\n');

    fs.writeFileSync(readmePath, newReadme);
};

run();