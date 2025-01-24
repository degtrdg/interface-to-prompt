/*
<ai_context>
Configures Drizzle for the app.
</ai_context>
*/

import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: ".env" })

export default defineConfig({
  schema: "@repo/db/schema/index.ts",
  out: "@repo/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
