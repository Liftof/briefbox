import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Default to a dummy connection string if not set, to prevent build errors during dev
// In production, DATABASE_URL must be set
const sql = neon(process.env.DATABASE_URL || 'postgres://user:pass@host:5432/db');
export const db = drizzle(sql, { schema });

