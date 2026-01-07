import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

// Try connecting as postgres user
const connectionString = "postgresql://postgres:StrongPassword123@localhost:5433/postgres";

const client = new Client({
  connectionString: connectionString,
});

async function checkConnection() {
  try {
    console.log(`Connecting as postgres user...`);
    await client.connect();
    console.log('✅ Connection successful as postgres user!');
    
    // List users
    const res = await client.query('SELECT usename FROM pg_shadow');
    console.log('Users found:', res.rows.map(r => r.usename).join(', '));
    
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed as postgres user');
    console.error('Error message:', err.message);
    process.exit(1);
  }
}

checkConnection();
