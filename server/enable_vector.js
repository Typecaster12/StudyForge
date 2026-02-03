import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function enableVector() {
    try {
        console.log('Enabling pgvector extension...');
        await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
        console.log('Success: pgvector extension enabled.');
    } catch (err) {
        console.error('Failed to enable pgvector:', err);
    } finally {
        await sql.end();
    }
}

enableVector();
