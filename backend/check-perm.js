import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function check(user, pass) {
  const connectionString = `postgresql://${user}:${encodeURIComponent(pass)}@localhost:5433/schoolerp`;
  console.log(`Trying ${user}...`);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`✅ Connected as ${user}`);
    const res = await client.query("SELECT has_schema_privilege(current_user, 'public', 'CREATE');");
    console.log(`Can create in public? ${res.rows[0].has_schema_privilege}`);
    await client.end();
    return true;
  } catch (e) {
    console.log(`❌ Failed as ${user}: ${e.message}`);
    return false;
  }
}

async function main() {
  await check('schooluser', 'Bqsir@889');
  await check('postgres', 'Bqsir@889');
  await check('postgres', 'StrongPassword123');
  await check('postgres', 'postgres');
}

main();
