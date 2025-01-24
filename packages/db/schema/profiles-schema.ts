/*
<ai_context>
Defines the database schema for profiles.
</ai_context>
*/

import { pgEnum, text, timestamp } from "drizzle-orm/pg-core";

import { createTable } from "../utils/table";

export const membershipEnum = pgEnum("membership", ["free", "pro"]);

export const profiles = createTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  membership: membershipEnum("membership").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;
