import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    // Check if table exists first to avoid error
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'RadioProgram'
      );
    `);
    
    if (res.rows[0].exists) {
      await pool.query('DELETE FROM "RadioProgram"');
      console.log('Deleted all radio programs');
    } else {
      console.log('Table RadioProgram does not exist yet');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();