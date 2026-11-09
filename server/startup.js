/**
 * startup.js — Smart production startup for Railway
 * Seeds the database only if it is empty, then starts the server.
 * This prevents wiping user data on every redeploy while ensuring
 * a fresh Railway instance always has demo data to work with.
 */

const { db, initDatabase } = require('./db/database');

async function main() {
  console.log('=== CampusEquip Startup ===');

  // Ensure schema exists first
  initDatabase();

  // Check if database already has users (i.e. was previously seeded)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();

  if (userCount.count === 0) {
    console.log('Database is empty — running seed...');
    // Dynamically require seed so it only runs when needed
    await require('./db/seed').seed();
    console.log('Seed complete.');
  } else {
    console.log(`Database already has ${userCount.count} users — skipping seed.`);
  }

  // Now start the actual server
  require('./server');
}

main().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});
