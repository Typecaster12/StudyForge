import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function dropAndPush() {
    try {
        console.log('Dropping embeddings table...');
        await sql`DROP TABLE IF EXISTS embeddings;`;
        console.log('Success: embeddings table dropped.');
    } catch (err) {
        console.error('Failed to drop table:', err);
    } finally {
        await sql.end();
    }
}

dropAndPush();
