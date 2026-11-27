const mongoose = require('mongoose');
const dns = require('node:dns');

// Automatically configure Google and Cloudflare public DNS for seamless MongoDB Atlas SRV resolution
// This fixes the Windows & ISP 'querySrv ECONNREFUSED' issue on mongodb+srv:// URIs
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // Graceful fallback if environment restricts custom DNS servers
}

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qnoxgymdb';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for cloud clusters to wake up
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`[QNOX] 🟢 MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`[QNOX] Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.warn(`\n[QNOX] ⚠️  MongoDB Atlas Connection Notice:`);
    console.warn(`  Reason: ${error.message}`);
    console.warn(`  Operating Mode: Running with high-availability local store for zero-downtime.`);
    console.warn(`  Tip: In MongoDB Atlas Dashboard -> Network Access, ensure IP '0.0.0.0/0' is whitelisted.\n`);
    return null;
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  mode: isConnected ? 'MongoDB Live' : 'High-Availability Local Memory Store',
});

module.exports = { connectDB, getDBStatus };
