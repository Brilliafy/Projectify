import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Force load the .env file immediately
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://admin:password123@localhost:5432/userdb",
  },
});