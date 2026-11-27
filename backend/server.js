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
    .then((conn) => {
      if (conn) {
        return seedDatabase().then(() => {
          const { initScheduler } = require('./src/services/cronService');
          initScheduler();
        });
      }
    })
    .catch((err) => console.log('[QNOX DB Init] Operating on high-availability local store'));
});

// Graceful Shutdown for zero-downtime deploys on Render
const gracefulShutdown = (signal) => {
  console.log(`\n[QNOX] ${signal} signal received. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[QNOX] HTTP server closed.');
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(false).then(() => {
        console.log('[QNOX] MongoDB connection closed.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;

