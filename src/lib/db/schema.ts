import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const letterTypeEnum = pgEnum('letter_type', ['typed', 'scanned'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const letters = pgTable('letters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  content: text('content'), // typed letters
  imageUrl: text('image_url'), // scanned letters (Cloudinary URL)
  type: letterTypeEnum('type').notNull(),
  deliverAt: timestamp('deliver_at').notNull(),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Letter = typeof letters.$inferSelect
export type NewLetter = typeof letters.$inferInsert
