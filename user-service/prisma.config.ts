import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Force load the .env file immediately
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});