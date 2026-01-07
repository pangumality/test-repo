import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function checkConnection() {
  try {
    // Mask password in log
    const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to ${maskedUrl}...`);
    
    await client.connect();
    console.log('✅ Connection successful!');
    const res = await client.query('SELECT NOW()');
    console.log('Server time:', res.rows[0].now);
    await client.end();
  } catch (err) {
    console.error('❌ Connection failed');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    if (err.message && err.message.includes('password authentication failed')) {
       console.error('👉 Tip: Double check your password in .env file.');
    }
    process.exit(1);
  }
}

checkConnection();
