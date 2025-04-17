import {
  pgTable,
  timestamp,
  boolean,
  integer,
  varchar,
  foreignKey,
  uuid,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const status = pgEnum('status', ['draft', 'published', 'archived']);

export const projects = pgTable('projects', {
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  featured: boolean().default(false).notNull(),
  id: integer().primaryKey().generatedAlwaysAsIdentity({
    name: 'projects_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  name: varchar().notNull(),
  thumbnail: varchar().notNull(),
  url: varchar().notNull(),
});

export const projectTags = pgTable(
  'project_tags',
  {
    createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
    id: integer().primaryKey().generatedAlwaysAsIdentity({
      name: 'project_tags_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 2147483647,
      cache: 1,
    }),
    projectId: integer('project_id').notNull(),
    tagId: integer('tag_id').notNull(),
  },
  (table) => {
    return {
      projectTagsProjectIdProjectsIdFk: foreignKey({
        columns: [table.projectId],
        foreignColumns: [projects.id],
        name: 'project_tags_project_id_projects_id_fk',
      }),
      projectTagsTagIdTagsIdFk: foreignKey({
        columns: [table.tagId],
        foreignColumns: [tags.id],
        name: 'project_tags_tag_id_tags_id_fk',
      }),
    };
  }
);

export const tags = pgTable('tags', {
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  id: integer().primaryKey().generatedAlwaysAsIdentity({
    name: 'tags_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  name: varchar().notNull(),
});

export const blog = pgTable('blog', {
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  description: varchar(),
  id: uuid().defaultRandom().primaryKey().notNull(),
  status: status().default('draft').notNull(),
  title: varchar().notNull(),
});

export const blogContent = pgTable('blog_content', {
  blogId: uuid('blog_id').notNull(),
  content: varchar().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  id: integer().primaryKey().generatedAlwaysAsIdentity({
    name: 'blog_content_id_seq',
    startWith: 1,
    increment: 1,
    minValue: 1,
    maxValue: 2147483647,
    cache: 1,
  }),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});
