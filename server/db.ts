import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Required for Neon serverless driver
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a new pool using the DATABASE_URL environment variable
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize Drizzle with the pool and schema
export const db = drizzle(pool, { schema });