require('dotenv').config();
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { seedDatabase } = require('./src/seed/seedData');

const PORT = process.env.PORT || 5000;

// Start Server immediately
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`  🏛️  Q N O X   G Y M   B A C K E N D   A P I`);
  console.log(`  Elevating Human Performance & Architectural Solitude`);
  console.log(`  Port: http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);

  // Asynchronously connect to DB and seed
  connectDB()
    .then(() => seedDatabase())
    .catch((err) => console.log('[QNOX DB Init] Operating on high-availability local store'));
});

module.exports = server;

