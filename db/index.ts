import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Use briefbox_DATABASE_URL (Neon integration) or DATABASE_URL as fallback
const connectionString = process.env.briefbox_DATABASE_URL || process.env.DATABASE_URL || 'postgres://user:pass@host:5432/db';
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

