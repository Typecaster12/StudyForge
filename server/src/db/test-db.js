import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set in environment variables');
    process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function testConnection() {
    try {
        console.log('Testing database connection...');
        // Simple query to check connection
        await client`SELECT 1`;
        console.log('Database connection successful!');
        process.exit(0);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

testConnection();
