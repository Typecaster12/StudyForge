import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

const sql = postgres(process.env.DATABASE_URL, {
    connect_timeout: 10,
});

async function test() {
    try {
        const result = await sql`SELECT 1 as connected`;
        console.log('Connection successful:', result);
    } catch (err) {
        console.error('Connection failed:', err);
    } finally {
        await sql.end();
    }
}

test();
