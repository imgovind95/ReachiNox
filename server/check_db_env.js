require('dotenv').config();
const { Client } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
console.log("Testing connection to:", databaseUrl);

const client = new Client({
    connectionString: databaseUrl,
});

async function testConnection() {
    try {
        await client.connect();
        console.log("✅ Connected successfully to PostgreSQL using .env!");
        const res = await client.query('SELECT NOW()');
        console.log("Time:", res.rows[0]);
        await client.end();
    } catch (err) {
        console.error("❌ Connection failed with .env credentials:", err.message);
        process.exit(1);
    }
}

testConnection();
